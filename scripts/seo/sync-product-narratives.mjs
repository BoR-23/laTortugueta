import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase environment variables.')
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

const narratives = {
  alzira: {
    storyTitle: 'Alzira entre naranjos y huerta',
    storyOrigin: 'Ribera Alta, amaneceres de huerta y terrazas abiertas al Xúquer',
    storyCost: 'Bordado artesanal pensado para indumentaria tradicional con lectura cromática mediterránea',
    storyBody:
      'Alzira despierta con la niebla suave de la huerta y el perfume de los naranjos cuando el día apenas empieza. Este modelo recoge esa calma de la Ribera en una composición de tonos tierra, verdes cítricos y pequeños contrastes que recuerdan los caminos entre bancales. Son calcetines tradicionales valencianos con carácter sereno, hechos para acompañar la indumentaria con la misma elegancia pausada que tiene la ciudad al amanecer.',
    storyBodyVa:
      'Alzira s\'obri entre tarongers, horta i llum de la Ribera. Este model arreplega eixa calma amb tons de terra i verds cítrics pensats per a una indumentària valenciana delicada i molt arrelada.',
    storyMetaDescription:
      'Calcetines tradicionales valencianos Alzira inspirados en la huerta y los naranjos de la Ribera. Diseño artesanal para indumentaria valenciana.',
    storyImages: [
      'https://upload.wikimedia.org/wikipedia/commons/e/e3/Oranges_-_whole-halved-segment.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/2/28/El_riu_X%C3%BAquer_al_seu_pas_per_Fortaleny_%28Pa%C3%ADs_Valenci%C3%A0%29%2C_2.jpg'
    ]
  },
  agullent: {
    storyTitle: 'Agullent y el silencio de la Vall d\'Albaida',
    storyOrigin: 'Pueblo de montaña, piedra, cielo abierto y campanas lentas',
    storyCost: 'Diseño sobrio y equilibrado para vestir tradición sin exceso',
    storyBody:
      'Agullent tiene esa belleza de los pueblos que se guardan entre montañas y dejan que el tiempo pase despacio. En este diseño mandan los grises de piedra, los azules anchos del cielo y un pulso cromático más contenido, pensado para quien busca calcetines artesanales valencianos con presencia sobria. El resultado es una pieza serena y firme, muy ligada al paisaje interior y a la elegancia silenciosa de la Vall d\'Albaida.',
    storyBodyVa:
      'Agullent viu entre muntanyes i pedra, amb una llum neta i silenciosa. El model aposta per una elegància sòbria, molt pròpia dels pobles d\'interior i de la indumentària ben entesa.',
    storyMetaDescription:
      'Calcetines tradicionales valencianos Agullent con inspiración de montaña, piedra y cielo abierto. Artesanía sobria para indumentaria regional.',
    storyImages: [
      'https://upload.wikimedia.org/wikipedia/commons/6/6c/Agullent._Ajuntament_1.JPG'
    ]
  },
  ador: {
    storyTitle: 'Ador entre marjal y Mediterráneo',
    storyOrigin: 'Paisaje húmedo, arrozales, cañas y memoria de costa',
    storyCost: 'Composición cromática con verdes húmedos y azules lejanos',
    storyBody:
      'Ador mira hacia ese territorio donde la tierra mojada y el mar se entienden sin hablar demasiado. El modelo traslada a la calcetería artesanal valenciana los marrones húmedos, los verdes de caña y la intuición azul del Mediterráneo al fondo. Es un diseño con raíz, pensado para quien quiere llevar en la indumentaria un eco de marjal, de tradición agrícola y de paisaje vivido.',
    storyBodyVa:
      'Ador respira marjal, canyar i proximitat de mar. El disseny recull eixos verds humits i blaus mediterranis per a donar-li una ànima molt valenciana al conjunt.',
    storyMetaDescription:
      'Calcetines tradicionales valencianos Ador inspirados en el marjal y el Mediterráneo. Diseño artesanal con tonos húmedos y raíz valenciana.',
    storyImages: [
      'https://upload.wikimedia.org/wikipedia/commons/3/3e/Aiguamoll.JPG',
      'https://upload.wikimedia.org/wikipedia/commons/9/96/Mediterranee_02_EN.jpg'
    ]
  },
  alberri: {
    storyTitle: 'Alberri, huerta antigua y flor de azahar',
    storyOrigin: 'Acequias, regadío y memoria agrícola de generaciones',
    storyCost: 'Diseño de lectura vegetal con blancos suaves y fondo fértil',
    storyBody:
      'Alberri suena a huerta trabajada, a agua que corre por acequias y a naranjos que conocen bien el paso de las estaciones. Este modelo toma de ahí su equilibrio: el verde del regadío, el marrón de la tierra fértil y el blanco limpio del azahar en marzo. Son calcetines tradicionales valencianos que traducen el paisaje agrícola en una pieza cálida, delicada y muy fácil de integrar en conjuntos de indumentaria con personalidad.',
    storyBodyVa:
      'Alberri evoca séquies, horta fonda i flor de taronger. El model combina verds de regadiu, marrons de terra i blancs suaus per a una peça amb molta memòria valenciana.',
    storyMetaDescription:
      'Calcetines tradicionales valencianos Alberri inspirados en la huerta, las acequias y el azahar. Artesanía con tonos fértiles y mediterráneos.',
    storyImages: [
      'https://upload.wikimedia.org/wikipedia/commons/8/8a/La_Canova_Acequia_North.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/b/b0/OrangeBloss_wb.jpg'
    ]
  },
  barx: {
    storyTitle: 'Barx, altura, piedra y horizonte',
    storyOrigin: 'Subida de curvas, montaña abierta y mar al fondo',
    storyCost: 'Contraste pensado para piezas con ritmo visual y fondo mineral',
    storyBody:
      'Barx tiene ese gesto de los lugares a los que se sube para mirar más lejos. El diseño recoge la dureza noble de la piedra, la amplitud del cielo y la línea azul que recuerda que el mar está ahí, aunque quede al fondo. En clave de calcetería artesanal valenciana, el modelo trabaja el contraste con mucha limpieza para ofrecer una pieza firme, vistosa y muy ligada a los paisajes que unen montaña y Mediterráneo.',
    storyBodyVa:
      'Barx és altura, pedra i aire obert. El model juga amb grisos minerals i blaus d\'horitzó per a donar-li força i claredat a la indumentària valenciana.',
    storyMetaDescription:
      'Calcetines tradicionales valencianos Barx inspirados en la montaña, la piedra y el horizonte mediterráneo. Diseño artesanal con contraste elegante.',
    storyImages: [
      'https://upload.wikimedia.org/wikipedia/commons/a/ae/Barx_des_del_cim_de_l%27Aldaia%2C_a_la_serra_del_Buixcarr%C3%B3.jpg'
    ]
  },
  'el-nespler': {
    storyTitle: 'El Nespler, lo dulce de lo cotidiano',
    storyOrigin: 'Patios mediterráneos, fruta madura y memoria doméstica',
    storyCost: 'Paleta cálida para un diseño amable y muy reconocible',
    storyBody:
      'El Nespler nace de una imagen sencilla y poderosa: la fruta del patio, la sobremesa lenta y las manos manchadas de un verano mediterráneo. El diseño traduce esa ternura doméstica en tonos anaranjados, verdes suaves y matices cálidos que hacen del calcetín una pieza cercana y luminosa. Dentro de la colección de calcetines tradicionales valencianos, es uno de esos modelos que conectan con la parte más íntima y cotidiana del paisaje.',
    storyBodyVa:
      'El Nespler parla de pati, d\'estiu i de fruita madura. És un model càlid i amable, amb colors mediterranis que transmeten proximitat i memòria quotidiana.',
    storyMetaDescription:
      'Calcetines tradicionales valencianos El Nespler inspirados en el níspero y los patios mediterráneos. Artesanía cálida y luminosa.',
    storyImages: [
      'https://upload.wikimedia.org/wikipedia/commons/9/99/Medlar_pomes_and_leaves.jpg'
    ]
  },
  '3-fonts': {
    storyTitle: '3-Fonts y el paisaje del agua compartida',
    storyOrigin: 'Fuentes como punto de encuentro en el territorio valenciano',
    storyCost: 'Diseño de contraste fresco con lectura acuática y mineral',
    storyBody:
      'Tres fuentes significan conversación, paso, descanso y memoria de camino. Este modelo toma esa idea del agua compartida para construir una pieza donde mandan los azules limpios, los verdes de musgo y la piedra que encauza el caudal. Son calcetines tradicionales valencianos con una lectura fresca y muy territorial, pensados para quien aprecia los diseños que cuentan paisaje sin perder equilibrio ni elegancia.',
    storyBodyVa:
      '3-Fonts naix de l\'aigua, de la pedra i dels llocs on la gent es troba. El model combina blaus clars i verds humits per a una peça fresca i molt vinculada al territori.',
    storyMetaDescription:
      'Calcetines tradicionales valencianos 3-Fonts inspirados en fuentes, agua y piedra. Diseño artesanal fresco para indumentaria valenciana.',
    storyImages: [
      'https://upload.wikimedia.org/wikipedia/commons/f/f6/Nacentemackinac.jpg'
    ]
  },
  '3-fonts-con-letra': {
    storyTitle: '3-Fonts con Letra, el paisaje cuando se nombra',
    storyOrigin: 'La fuente como memoria y la letra como gesto de identidad',
    storyCost: 'Versión personalizada con una capa simbólica añadida al diseño base',
    storyBody:
      '3-Fonts con Letra conserva la frescura del agua, la piedra y el musgo, pero añade algo más: la elegancia de lo nombrado. La letra introduce identidad sin romper el equilibrio del diseño y convierte el calcetín en una pieza todavía más personal. Dentro de la calcetería artesanal valenciana, esta versión funciona muy bien cuando se busca tradición con un matiz propio, reconocible y delicadamente singular.',
    storyBodyVa:
      '3-Fonts amb lletra manté l\'essència d\'aigua i pedra del model original, però afegeix identitat. La lletra li dona un punt personal i distingit sense perdre arrel valenciana.',
    storyMetaDescription:
      'Calcetines tradicionales valencianos 3-Fonts con Letra inspirados en fuentes y paisaje de agua. Versión artesanal personalizada con identidad propia.',
    storyImages: [
      'https://upload.wikimedia.org/wikipedia/commons/f/f6/Nacentemackinac.jpg'
    ]
  },
  acacia: {
    storyTitle: 'Acacia, sombra y flor sobre el patio',
    storyOrigin: 'Árbol mediterráneo, verano doméstico y luz tamizada',
    storyCost: 'Paleta vegetal de blancos, verdes y marrones cálidos',
    storyBody:
      'Acacia remite a los veranos de patio, a la sombra buena y a la flor clara que cae sobre el suelo cuando el calor aprieta. El diseño trabaja esa atmósfera con blancos floridos, verdes profundos y un marrón cálido que recuerda la corteza del árbol. Como calcetín tradicional valenciano, es una pieza elegante y fresca, muy adecuada para conjuntos que agradecen un detalle natural y un tono mediterráneo más suave.',
    storyBodyVa:
      'Acacia és ombra, flor blanca i pati d\'estiu. El model combina verds profunds i blancs suaus per a una peça natural, fresca i molt mediterrània.',
    storyMetaDescription:
      'Calcetines tradicionales valencianos Acacia inspirados en la sombra, la flor y el patio mediterráneo. Diseño artesanal natural y elegante.',
    storyImages: [
      'https://upload.wikimedia.org/wikipedia/commons/b/bd/Acacia_dealbata_tree_2.jpg'
    ]
  },
  arenal: {
    storyTitle: 'Arenal, donde la arena toca el Mediterráneo',
    storyOrigin: 'Orilla, espuma y transición entre tierra y mar',
    storyCost: 'Diseño luminoso de arena mojada, blanco espumoso y azul abierto',
    storyBody:
      'Arenal se inspira en ese punto exacto donde la arena húmeda, la espuma y el cielo se mezclan en una misma franja de luz. El modelo lleva al lenguaje de la calcetería artesanal valenciana colores claros, azules serenos y una sensación de horizonte abierto que funciona muy bien en conjunto. Es una pieza mediterránea y limpia, ideal para quien busca calcetines tradicionales con un aire costero y elegante.',
    storyBodyVa:
      'Arenal mira a la vora del mar, a l\'escuma i a l\'arena banyada. El model és clar, mediterrani i molt lluminós, amb una elegància costanera fàcil de reconéixer.',
    storyMetaDescription:
      'Calcetines tradicionales valencianos Arenal inspirados en la arena, la espuma y el Mediterráneo. Diseño artesanal luminoso para indumentaria valenciana.',
    storyImages: [
      'https://upload.wikimedia.org/wikipedia/commons/4/43/Platja_de_l%27Arenal.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/9/96/Mediterranee_02_EN.jpg'
    ]
  }
}

for (const [id, payload] of Object.entries(narratives)) {
  const { data: current, error: fetchError } = await supabase
    .from('products')
    .select('metadata')
    .eq('id', id)
    .single()

  if (fetchError) {
    throw fetchError
  }

  const metadata = {
    ...(current?.metadata ?? {}),
    ...payload
  }

  const { error: updateError } = await supabase
    .from('products')
    .update({ metadata })
    .eq('id', id)

  if (updateError) {
    throw updateError
  }

  console.log(`Updated ${id}`)
}
