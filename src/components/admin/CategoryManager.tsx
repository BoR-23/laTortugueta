"use client"

import { useEffect, useMemo, useState } from "react"
import { Tree, type NodeModel } from "@minoru/react-dnd-treeview"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"

import type { CategoryDTO, CategoryScope } from "@/types/categories"

type Props = {
  initialCategories: CategoryDTO[]
}

type FormMode = {
  type: "create"
  category?: undefined
} | {
  type: "edit"
  category: CategoryDTO
}

const scopeLabels: Record<CategoryScope, string> = {
  header: "Header",
  filter: "Filtro"
}

const rootId = "root"

type TreeNode = NodeModel<CategoryDTO>

const buildTreeData = (records: CategoryDTO[]): TreeNode[] =>
  records
    .sort((a, b) => a.order - b.order)
    .map(record => ({
      id: record.id,
      parent: record.parentId ?? rootId,
      text: record.name,
      droppable: true,
      data: record
    }))

const buildOptions = (records: CategoryDTO[], excludeIds: Set<string> = new Set()) => {
  type NodeWithChildren = CategoryDTO & { children: NodeWithChildren[] }
  const byId = new Map<string, NodeWithChildren>()
  records.forEach(record => {
    byId.set(record.id, { ...record, children: [] })
  })
  const roots: NodeWithChildren[] = []
  byId.forEach(node => {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  })
  const result: Array<{ id: string; name: string; depth: number }> = []
  const walk = (nodes: NodeWithChildren[], depth: number) => {
    nodes
      .sort((a, b) => a.order - b.order)
      .forEach(node => {
        if (!excludeIds.has(node.id)) {
          result.push({ id: node.id, name: node.name, depth })
          walk(node.children, depth + 1)
        }
      })
  }
  walk(roots, 0)
  return result
}

const getDescendantIds = (records: CategoryDTO[], targetId: string) => {
  const descendants = new Set<string>()
  const collect = (id: string) => {
    records
      .filter(record => record.parentId === id)
      .forEach(child => {
        descendants.add(child.id)
        collect(child.id)
      })
  }
  collect(targetId)
  return descendants
}

export function CategoryManager({ initialCategories }: Props) {
  const [categories, setCategories] = useState<CategoryDTO[]>(initialCategories)
  const [scope, setScope] = useState<CategoryScope>("header")
  const [isLoading, setIsLoading] = useState(false)
  const [formState, setFormState] = useState<FormMode | null>(null)
  const [formValues, setFormValues] = useState({ name: "", tagKey: "", parentId: "" })
  const [error, setError] = useState<string | null>(null)
  const [openIds, setOpenIds] = useState<string[]>([])

  const scopedCategories = useMemo(
    () => categories.filter(category => category.scope === scope),
    [categories, scope]
  )

  const treeData = useMemo(() => buildTreeData(scopedCategories), [scopedCategories])

  useEffect(() => {
    setOpenIds(treeData.map(node => String(node.id)))
  }, [scope, treeData])

  const refreshCategories = async () => {
    const response = await fetch("/api/categories")
    if (!response.ok) throw new Error("No se pudo obtener la lista de categorías")
    const data: CategoryDTO[] = await response.json()
    setCategories(data)
  }

  const handleDrop = async (tree: TreeNode[]) => {
    setCategories(prev =>
      prev.map(category => {
        const node = tree.find(item => item.id === category.id)
        if (!node || category.scope !== scope) return category
        const siblingIds = tree.filter(item => item.parent === node.parent).map(item => item.id)
        return {
          ...category,
          parentId: node.parent === rootId ? null : String(node.parent),
          order: siblingIds.indexOf(node.id)
        }
      })
    )

    const payload = tree
      .filter(node => node.id !== rootId)
      .map(node => {
        const siblingIds = tree.filter(item => item.parent === node.parent).map(item => item.id)
        return {
          id: String(node.id),
          parentId: node.parent === rootId ? null : String(node.parent),
          order: siblingIds.indexOf(node.id)
        }
      })
    try {
      setIsLoading(true)
      const response = await fetch("/api/categories/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      if (!response.ok) {
        throw new Error("No se pudo guardar el nuevo orden")
      }
      await refreshCategories()
    } catch (err) {
      console.error(err)
      setError(
        err instanceof Error ? err.message : "No se pudo guardar el nuevo orden. Inténtalo de nuevo."
      )
    } finally {
      setIsLoading(false)
    }
  }

  const openCreateForm = () => {
    setFormValues({ name: "", tagKey: "", parentId: "" })
    setFormState({ type: "create" })
  }

  const openEditForm = (category: CategoryDTO) => {
    setFormValues({
      name: category.name,
      tagKey: category.tagKey ?? "",
      parentId: category.parentId ?? ""
    })
    setFormState({ type: "edit", category })
  }

  const closeForm = () => {
    setFormState(null)
    setError(null)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      setIsLoading(true)
      const payload = {
        name: formValues.name,
        tagKey: formValues.tagKey || null,
        parentId: formValues.parentId || null,
        scope
      }
      const endpoint =
        formState?.type === "edit"
          ? `/api/categories/${formState.category?.id}`
          : "/api/categories"
      const method = formState?.type === "edit" ? "PUT" : "POST"
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error ?? "No se pudo guardar la categoría")
      }
      await refreshCategories()
      closeForm()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Error desconocido al guardar la categoría")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDuplicateToHeader = async (category: CategoryDTO) => {
    if (!category.tagKey) {
      setError("Esta categoría no tiene tag asociado. Asigna uno antes de enviarla al header.")
      return
    }
    try {
      setIsLoading(true)
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: category.name,
          tagKey: category.tagKey,
          parentId: null,
          scope: "header"
        })
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error ?? "No se pudo crear la categoría en el header")
      }
      await refreshCategories()
      setScope("header")
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Error al duplicar la categoría en el header")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (category: CategoryDTO) => {
    const confirmation = window.confirm(
      'Esta acción eliminará la categoría seleccionada y todas sus subcategorías. ¿Deseas continuar?'
    )
    if (!confirmation) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/categories/${category.id}`, {
        method: "DELETE"
      })
      if (!response.ok) {
        throw new Error("No se pudo eliminar la categoría")
      }
      await refreshCategories()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Error al eliminar la categoría")
    } finally {
      setIsLoading(false)
    }
  }

  const currentOptions = useMemo(() => {
    if (formState?.type === "edit" && formState.category) {
      const blockedIds = getDescendantIds(scopedCategories, formState.category.id)
      blockedIds.add(formState.category.id)
      return buildOptions(scopedCategories, blockedIds)
    }
    return buildOptions(scopedCategories)
  }, [formState, scopedCategories])

  return (
    <section className="mt-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2 rounded-full border border-neutral-200 bg-white p-1 text-[12px] font-semibold uppercase tracking-[0.25em]">
          {(Object.keys(scopeLabels) as CategoryScope[]).map(value => (
            <button
              key={value}
              type="button"
              onClick={() => setScope(value)}
              className={`rounded-full px-4 py-1 transition ${
                scope === value ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              {scopeLabels[value]}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="rounded-full border border-neutral-900 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.25em] text-neutral-900 transition hover:bg-neutral-900 hover:text-white"
        >
          Nueva categoría
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

        <div className="rounded-3xl border border-neutral-200 bg-white p-4">
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-neutral-400">
            Arrastra para reordenar o suelta encima de otra categoría para convertirla en subcategoría.
            Usa el triángulo para plegar o desplegar.
          </p>
          <DndProvider backend={HTML5Backend}>
            <Tree
              tree={treeData}
              rootId={rootId}
              onDrop={handleDrop}
              classes={{
                listItem: 'border border-transparent'
              }}
            render={(node, params) => {
              const { depth, isDragging, hasChild, isOpen, onToggle } = params
              return (
                <div
                  style={{ paddingLeft: depth * 20 }}
                  className={`flex items-center justify-between rounded-2xl border border-neutral-100 px-4 py-2 ${
                    isDragging ? "bg-neutral-50" : "bg-white"
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      {hasChild ? (
                        <button
                          type="button"
                          onClick={onToggle}
                          aria-label={isOpen ? "Cerrar" : "Abrir"}
                          className="flex h-6 w-6 items-center justify-center rounded-full border border-neutral-200 text-xs text-neutral-500 transition hover:border-neutral-900 hover:text-neutral-900"
                        >
                          {isOpen ? "▾" : "▸"}
                        </button>
                      ) : (
                        <span className="inline-block h-6 w-6" />
                      )}
                      <p className="text-sm font-semibold text-neutral-900">{node.text}</p>
                    </div>
                    <p className="ml-9 text-xs text-neutral-400">
                      {node.data?.tagKey ? `Tag: ${node.data.tagKey}` : "Sin tag asignado"}
                    </p>
                  </div>
                  <div className="flex gap-2 text-xs uppercase tracking-[0.2em]">
                    {scope === "filter" && (
                      <button
                        type="button"
                        onClick={() => handleDuplicateToHeader(node.data!)}
                        className="text-neutral-500 transition hover:text-neutral-900"
                      >
                        Enviar al header
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openEditForm(node.data!)}
                      className="text-neutral-500 transition hover:text-neutral-900"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(node.data!)}
                      className="text-red-500 transition hover:text-red-700"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              )
            }}
          />
        </DndProvider>
      </div>

      {formState ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-10">
          <div className="w-full max-w-lg rounded-3xl border border-neutral-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">
                {formState.type === "create" ? "Nueva categoría" : "Editar categoría"}
              </h2>
              <button type="button" onClick={closeForm} className="text-sm text-neutral-500">
                Cerrar
              </button>
            </div>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block text-sm font-medium text-neutral-700">
                Nombre
                <input
                  type="text"
                  value={formValues.name}
                  onChange={event => setFormValues(values => ({ ...values, name: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-2 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                  required
                />
              </label>
              <label className="block text-sm font-medium text-neutral-700">
                Tag asociado
                <input
                  type="text"
                  value={formValues.tagKey}
                  onChange={event => setFormValues(values => ({ ...values, tagKey: event.target.value }))}
                  placeholder="Ej: Calces De Ratlles"
                  className="mt-2 w-full rounded-2xl border border-neutral-200 px-4 py-2 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                />
                <span className="mt-1 block text-xs text-neutral-400">
                  Este valor se utiliza para filtrar productos. Debe coincidir con el tag real del catálogo.
                </span>
              </label>
              <label className="block text-sm font-medium text-neutral-700">
                Subcategoría de
                <select
                  value={formValues.parentId}
                  onChange={event => setFormValues(values => ({ ...values, parentId: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-neutral-900 focus:border-neutral-900 focus:outline-none"
                >
                  <option value="">Sin padre</option>
                  {currentOptions.map(option => (
                    <option key={option.id} value={option.id}>
                      {`${'— '.repeat(option.depth)}${option.name}`}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-full border border-neutral-200 px-5 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-neutral-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-full border border-neutral-900 bg-neutral-900 px-5 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}
