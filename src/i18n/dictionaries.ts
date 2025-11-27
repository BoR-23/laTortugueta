export type Locale = 'es' | 'ca' | 'en'

export const dictionaries = {
    es: {
        nav: {
            home: 'Inicio',
            blog: 'Blog',
            about: 'Quiénes somos',
            catalog: 'Catálogo',
            contact: 'Contacto'
        },
        blog: {
            title: 'Blog de calcetería tradicional',
            subtitle: 'Relatos y memoria',
            description: 'Historias, técnicas y archivos personales de Macu García y del taller familiar. Documentos para que cualquier persona entienda qué hay detrás de cada par de medias.',
            empty: 'Todavía no hay entradas publicadas.',
            readMore: 'Leer artículo completo',
            recentPosts: 'Entradas recientes',
            archive: 'Archivo',
            by: 'Por',
            backToBlog: 'Volver al blog'
        },
        about: {
            metaTitle: 'Quiénes somos',
            metaDescription: 'Calcetería artesana nacida en Alcoi en 1989. Taller familiar que documenta modelos históricos, trabaja bajo pedido y apuesta por materiales de proximidad.',
            sectionTitle: 'Quiénes somos',
            heroTitle: 'Calcetería artesana nacida en Alcoi y activa desde 1989.',
            heroDescription: 'Documentamos y reproducimos calcetines tradicionales con tejedoras manuales históricas, siempre bajo pedido y con materiales de proximidad. Esta página resume la historia completa del taller y cómo seguimos trabajando hoy.',
            contactTitle: 'Cómo contactar',
            contactText: 'Para hablar con nosotros solo tienes que escribir a',
            or: 'o',
            appointment: 'pedir cita con',
            noIntermediaries: 'Respondemos sin intermediarios y cada pedido se teje a medida.',
            openWhatsapp: 'Abrir WhatsApp',
            viewCatalog: 'Ver catálogo',
            sections: {
                whoWeAre: {
                    title: 'Quiénes somos',
                    p1: 'Calcetería artesana nacida en Alcoi y activa desde 1989.',
                    p2: 'La Tortugueta es un taller familiar que documenta y reproduce calcetines tradicionales con tejedoras manuales históricas. Trabajamos sin stock, bajo pedido. Apostamos por la proximidad: tanto el hilo como los envases se compran a proveedores de la Comunitat Valenciana. Además, nuestro compromiso ambiental es total: tanto el etiquetaje como las cajas de envío son de material reciclado.'
                },
                macuHistory: {
                    title: 'La historia de Macu',
                    p1: 'La Tortugueta nace en Alcoi (Alicante) en 1989 de la mano de Macu García, fundadora del "grup de danses" Sant Jordi, investigadora de indumentaria tradicional y coleccionista de tortugas. Detectó que casi no existían calcetines fieles a los originales y empezó a reproducirlos junto a una tejedora local.',
                    p2: 'En lugar de inventar, reproducía con los calcetines antiguos en la mano, trasladando el dibujo exacto a la galga 10 (adaptada a las máquinas de principios del XX, ya que los originales del XIX eran de galga 12). Los primeros pares se hacían exactamente igual que el antiguo y, más tarde, se adaptaban los colores a petición del cliente. Gustaron tanto en su grupo de "danses" que pronto comenzaron los encargos.',
                    p3: 'Durante los años 90 viajó semanalmente a Valencia para mostrar el muestrario en tiendas de indumentaria tradicional. En 2000 obtuvo el Sello de Artesanía de la Comunitat Valenciana (DECA nº 2324) —la única calcetería artesanal con esa acreditación—, en 2002 se constituyó como sociedad limitada y en 2011 recibió la Marca Parcs Naturals del Parc Natural del Carrascal de la Font Roja por su compromiso ambiental, del que nuestro etiquetaje en cartulina reciclada es un buen ejemplo.'
                },
                workshopToday: {
                    title: 'El taller hoy',
                    p1: 'Hoy continúa como empresa familiar: la siguiente generación mantiene vivas las tejedoras manuales, documenta cada modelo y conserva el oficio con la misma filosofía de siempre. No inventamos diseños nuevos; rescatamos piezas históricas para que sigan luciéndose tal como fueron concebidas, encontrando los originales en personas que nos los ceden, en museos, libros y visitas a archivos históricos donde fotografiamos los modelos antiguos.',
                    p2: (designs: number, years: number) => `Custodiamos un archivo con más de ${designs} modelos descritos al detalle y llevamos ${years} años consecutivos tejiendo, restaurando y difundiendo este oficio sin atajos industriales.`
                },
                products: {
                    title: 'Nuestros productos',
                    p1: 'Nuestro día a día se reparte entre varias familias de piezas, todas tejidas en algodón 100% del número 12 o del 8, y con la costura lateral cosida a mano.',
                    p2: 'Los más conocidos son los calcetines rayados: medias por bajo de la rodilla (conforme son las antiguas) con franjas geométricas y combinaciones cromáticas históricas. También creamos calcetines bordados, piezas lisas a las que se añade bordado artesanal con motivos florales, o incluso de animales, usando máquinas antiguas de bordar.',
                    p3: 'Ofrecemos medias lisas con un dibujo en el mismo color realizado en la propia tejedora manual, idénticas a las de la indumentaria valenciana clásica. Recuperamos piezas como las polainas y peúcos, que usaban los labradores, y confeccionamos bajo pedido cofias, barrets y lligacames. Estas últimas son cintas de otomán reproducidas de modelos antiguos, y las tenemos también bordadas con frases antiguas (en valenciano o castellano) sacadas de archivos históricos.',
                    p4: 'Además, realizamos encargos para grupos de "danses" de otras comunidades que nos mandan sus modelos antiguos, habiendo trabajado para Zamora, Zaragoza, Burgos, Galicia, Cataluña y Mallorca.'
                },
                recognitions: {
                    title: 'Reconocimientos',
                    p1: 'Los reconocimientos oficiales acompañan, pero sobre todo son una garantía. Estamos orgullosos de nuestro Sello de Artesanía de la Comunitat Valenciana (DECA nº 2324) desde el año 2000, así como de la Marca Parcs Naturals del Parc Natural Font Roja (2011) por nuestros procesos respetuosos.',
                    p2: 'Somos miembros del Centro de Artesanía de la Comunitat Valenciana y hemos sido finalistas en los Premios de Artesanía. Nuestro trabajo también ha llegado a grandes producciones, habiendo creado calcetería para cine, teatro y ópera, incluyendo películas como “Libertador” y “The Promise” (con un encargo de más de 200 pares) o para las sopranos del Teatro Real de Madrid. Detrás de cada sello hay un proceso manual que revisa tensión, vaporado y remates a mano antes de guardar cada calcetín en su envase de material reciclado.'
                },
                howWeWork: {
                    title: 'Cómo trabajamos',
                    p1: 'Llegamos a las personas igual que en los años noventa, ahora reforzados por la comunicación digital. Atendemos encargos directos por teléfono, correo o WhatsApp, ya que todas nuestras piezas son a medida: pedimos altura de pierna, grueso del gemelo y número de pie. Nuestras colecciones también se pueden encontrar en tiendas especializadas en indumentaria tradicional y seguimos presentes en ferias de artesanía y eventos festivos. Mantenemos una atención a distancia con envíos nacionales e internacionales, apoyándonos en las redes sociales.'
                },
                textileMemory: {
                    title: 'Memoria textil',
                    p1: 'Compartimos procesos porque la memoria textil necesita ser pública. Esto lo hacemos a través de reportajes en blogs como “Diario de una Peineta”, prensa local y revistas de fiestas, y mediante nuestra participación en producciones teatrales y de cine. Mantenemos una presencia constante en Facebook e Instagram (@latortugueta.calcetines), donde mostramos procesos y novedades.',
                    p2: 'Hacemos un llamamiento: si tienes calcetines antiguos, fotografías o historias familiares, podemos documentarlas y devolverlas restauradas o replicadas para que sigan presentes en fiestas, escenarios y grupos de folclore.'
                }
            }
        }
    },
    ca: {
        nav: {
            home: 'Inici',
            blog: 'Blog',
            about: 'Qui som',
            catalog: 'Catàleg',
            contact: 'Contacte'
        },
        blog: {
            title: 'Blog de calceteria tradicional',
            subtitle: 'Relats i memòria',
            description: 'Històries, tècniques i arxius personals de Macu García i del taller familiar. Documents perquè qualsevol persona entenga què hi ha darrere de cada parell de mitges.',
            empty: 'Encara no hi ha entrades publicades.',
            readMore: 'Llegir article complet',
            recentPosts: 'Entrades recents',
            archive: 'Arxiu',
            by: 'Per',
            backToBlog: 'Tornar al blog'
        },
        about: {
            metaTitle: 'Qui som',
            metaDescription: 'Calceteria artesana nascuda a Alcoi el 1989. Taller familiar que documenta models històrics, treballa sota comanda i aposta per materials de proximitat.',
            sectionTitle: 'Qui som',
            heroTitle: 'Calceteria artesana nascuda a Alcoi i activa des de 1989.',
            heroDescription: 'Documentem i reproduïm calcetins tradicionals amb teixidores manuals històriques, sempre sota comanda i amb materials de proximitat. Aquesta pàgina resumeix la història completa del taller i com seguim treballant avui.',
            contactTitle: 'Com contactar',
            contactText: 'Per parlar amb nosaltres només has d\'escriure a',
            or: 'o',
            appointment: 'demanar cita amb',
            noIntermediaries: 'Responem sense intermediaris i cada comanda es teixeix a mida.',
            openWhatsapp: 'Obrir WhatsApp',
            viewCatalog: 'Veure catàleg',
            sections: {
                whoWeAre: {
                    title: 'Qui som',
                    p1: 'Calceteria artesana nascuda a Alcoi i activa des de 1989.',
                    p2: 'La Tortugueta és un taller familiar que documenta i reprodueix calcetins tradicionals amb teixidores manuals històriques. Treballem sense estoc, sota comanda. Apostem per la proximitat: tant el fil com els envasos es compren a proveïdors de la Comunitat Valenciana. A més, el nostre compromís ambiental és total: tant l\'etiquetatge com les caixes d\'enviament són de material reciclat.'
                },
                macuHistory: {
                    title: 'La història de Macu',
                    p1: 'La Tortugueta neix a Alcoi (Alacant) el 1989 de la mà de Macu García, fundadora del "grup de danses" Sant Jordi, investigadora d\'indumentària tradicional i col·leccionista de tortugues. Va detectar que gairebé no existien calcetins fidels als originals i va començar a reproduir-los al costat d\'una teixidora local.',
                    p2: 'En lloc d\'inventar, reproduïa amb els calcetins antics a la mà, traslladant el dibuix exacte a la galga 10 (adaptada a les màquines de principis del XX, ja que els originals del XIX eren de galga 12). Els primers parells es feien exactament igual que l\'antic i, més tard, s\'adaptaven els colors a petició del client. Van agradar tant al seu grup de "danses" que aviat van començar els encàrrecs.',
                    p3: 'Durant els anys 90 va viatjar setmanalment a València per mostrar el mostrari en botigues d\'indumentària tradicional. El 2000 va obtenir el Segell d\'Artesania de la Comunitat Valenciana (DECA núm. 2324) —l\'única calceteria artesanal amb aquesta acreditació—, el 2002 es va constituir com a societat limitada i el 2011 va rebre la Marca Parcs Naturals del Parc Natural del Carrascal de la Font Roja pel seu compromís ambiental, del qual el nostre etiquetatge en cartolina reciclada és un bon exemple.'
                },
                workshopToday: {
                    title: 'El taller avui',
                    p1: 'Avui continua com a empresa familiar: la següent generació manté vives les teixidores manuals, documenta cada model i conserva l\'ofici amb la mateixa filosofia de sempre. No inventem dissenys nous; rescatem peces històriques perquè segueixin lluint-se tal com van ser concebudes, trobant els originals en persones que ens els cedeixen, en museus, llibres i visites a arxius històrics on fotografiem els models antics.',
                    p2: (designs: number, years: number) => `Custodiem un arxiu amb més de ${designs} models descrits al detall i portem ${years} anys consecutius teixint, restaurant i difonent aquest ofici sense dreceres industrials.`
                },
                products: {
                    title: 'Els nostres productes',
                    p1: 'El nostre dia a dia es reparteix entre diverses famílies de peces, totes teixides en cotó 100% del número 12 o del 8, i amb la costura lateral cosida a mà.',
                    p2: 'Els més coneguts són els calcetins ratllats: mitges per sota del genoll (com són les antigues) amb franges geomètriques i combinacions cromàtiques històriques. També creem calcetins brodats, peces llises a les quals s\'afegeix brodat artesanal amb motius florals, o fins i tot d\'animals, utilitzant màquines antigues de brodar.',
                    p3: 'Oferim mitges llises amb un dibuix en el mateix color realitzat en la pròpia teixidora manual, idèntiques a les de la indumentària valenciana clàssica. Recuperem peces com les polaines i peücs, que usaven els llauradors, i confeccionem sota comanda còfies, barrets i lligacames. Aquestes últimes són cintes d\'otomà reproduïdes de models antics, i les tenim també brodades amb frases antigues (en valencià o castellà) tretes d\'arxius històrics.',
                    p4: 'A més, realitzem encàrrecs per a grups de "danses" d\'altres comunitats que ens envien els seus models antics, havent treballat per a Zamora, Saragossa, Burgos, Galícia, Catalunya i Mallorca.'
                },
                recognitions: {
                    title: 'Reconeixements',
                    p1: 'Els reconeixements oficials acompanyen, però sobretot són una garantia. Estem orgullosos del nostre Segell d\'Artesania de la Comunitat Valenciana (DECA núm. 2324) des de l\'any 2000, així com de la Marca Parcs Naturals del Parc Natural Font Roja (2011) pels nostres processos respectuosos.',
                    p2: 'Som membres del Centre d\'Artesania de la Comunitat Valenciana i hem estat finalistes als Premis d\'Artesania. El nostre treball també ha arribat a grans produccions, havent creat calceteria per a cinema, teatre i òpera, incloent pel·lícules com “Libertador” i “The Promise” (amb un encàrrec de més de 200 parells) o per a les sopranos del Teatro Real de Madrid. Darrere de cada segell hi ha un procés manual que revisa tensió, vaporat i remats a mà abans de guardar cada calcetí en el seu envàs de material reciclat.'
                },
                howWeWork: {
                    title: 'Com treballem',
                    p1: 'Arribem a les persones igual que als anys noranta, ara reforçats per la comunicació digital. Atenem encàrrecs directes per telèfon, correu o WhatsApp, ja que totes les nostres peces són a mida: demanem alçada de cama, gruix del bessó i número de peu. Les nostres col·leccions també es poden trobar en botigues especialitzades en indumentària tradicional i seguim presents en fires d\'artesania i esdeveniments festius. Mantenim una atenció a distància amb enviaments nacionals i internacionals, recolzant-nos en les xarxes socials.'
                },
                textileMemory: {
                    title: 'Memòria tèxtil',
                    p1: 'Compartim processos perquè la memòria tèxtil necessita ser pública. Això ho fem a través de reportatges en blogs com “Diario de una Peineta”, premsa local i revistes de festes, i mitjançant la nostra participació en produccions teatrals i de cinema. Mantenim una presència constant a Facebook i Instagram (@latortugueta.calcetines), on mostrem processos i novetats.',
                    p2: 'Fem una crida: si tens calcetins antics, fotografies o històries familiars, podem documentar-les i tornar-les restaurades o replicades perquè segueixin presents en festes, escenaris i grups de folklore.'
                }
            }
        }
    },
    en: {
        nav: {
            home: 'Home',
            blog: 'Blog',
            about: 'About us',
            catalog: 'Catalog',
            contact: 'Contact'
        },
        blog: {
            title: 'Traditional Hosiery Blog',
            subtitle: 'Stories and Memory',
            description: 'Stories, techniques, and personal archives of Macu García and the family workshop. Documents so anyone can understand what lies behind each pair of stockings.',
            empty: 'No entries published yet.',
            readMore: 'Read full article',
            recentPosts: 'Recent Posts',
            archive: 'Archive',
            by: 'By',
            backToBlog: 'Back to blog'
        },
        about: {
            metaTitle: 'About Us',
            metaDescription: 'Artisan hosiery born in Alcoi in 1989. Family workshop documenting historical models, working on demand, and committed to local materials.',
            sectionTitle: 'About Us',
            heroTitle: 'Artisan hosiery born in Alcoi and active since 1989.',
            heroDescription: 'We document and reproduce traditional socks with historical manual knitting machines, always on demand and with local materials. This page summarizes the complete history of the workshop and how we continue working today.',
            contactTitle: 'How to Contact',
            contactText: 'To speak with us, just write to',
            or: 'or',
            appointment: 'book an appointment with',
            noIntermediaries: 'We answer without intermediaries, and every order is knitted to measure.',
            openWhatsapp: 'Open WhatsApp',
            viewCatalog: 'View Catalog',
            sections: {
                whoWeAre: {
                    title: 'Who We Are',
                    p1: 'Artisan hosiery born in Alcoi and active since 1989.',
                    p2: 'La Tortugueta is a family workshop that documents and reproduces traditional socks with historical manual knitting machines. We work without stock, on demand. We are committed to proximity: both the yarn and the packaging are bought from suppliers in the Valencian Community. In addition, our environmental commitment is total: both the labeling and the shipping boxes are made of recycled material.'
                },
                macuHistory: {
                    title: 'Macu\'s History',
                    p1: 'La Tortugueta was born in Alcoi (Alicante) in 1989 by Macu García, founder of the "grup de danses" Sant Jordi, researcher of traditional clothing, and turtle collector. She detected that there were almost no socks faithful to the originals and began to reproduce them together with a local knitter.',
                    p2: 'Instead of inventing, she reproduced with the old socks in hand, transferring the exact pattern to gauge 10 (adapted to early 20th-century machines, since the 19th-century originals were gauge 12). The first pairs were made exactly like the old ones and, later, colors were adapted at the client\'s request. They were so liked in her "danses" group that orders soon began.',
                    p3: 'During the 90s, she traveled weekly to Valencia to show the samples in traditional clothing stores. In 2000 she obtained the Craftsmanship Seal of the Valencian Community (DECA No. 2324) —the only artisan hosiery with this accreditation—, in 2002 it was constituted as a limited company, and in 2011 received the Parcs Naturals Brand of the Carrascal de la Font Roja Natural Park for its environmental commitment, of which our recycled cardboard labeling is a good example.'
                },
                workshopToday: {
                    title: 'The Workshop Today',
                    p1: 'Today it continues as a family business: the next generation keeps the manual knitting machines alive, documents each model, and preserves the trade with the same philosophy as always. We do not invent new designs; we rescue historical pieces so they continue to be worn as they were conceived, finding originals in people who lend them to us, in museums, books, and visits to historical archives where we photograph old models.',
                    p2: (designs: number, years: number) => `We guard an archive with more than ${designs} models described in detail and have been knitting, restoring, and disseminating this trade for ${years} consecutive years without industrial shortcuts.`
                },
                products: {
                    title: 'Our Products',
                    p1: 'Our day-to-day is divided between several families of pieces, all knitted in 100% cotton number 12 or 8, and with the side seam sewn by hand.',
                    p2: 'The best known are the striped socks: stockings below the knee (as the old ones are) with geometric stripes and historical color combinations. We also create embroidered socks, plain pieces to which handmade embroidery with floral motifs, or even animals, is added using old embroidery machines.',
                    p3: 'We offer plain stockings with a drawing in the same color made on the manual knitting machine itself, identical to those of classic Valencian clothing. We recover pieces like leggings and booties, used by farmers, and make caps, hats, and garters on demand. The latter are ottoman ribbons reproduced from old models, and we also have them embroidered with old phrases (in Valencian or Spanish) taken from historical archives.',
                    p4: 'In addition, we carry out orders for "danses" groups from other communities that send us their old models, having worked for Zamora, Zaragoza, Burgos, Galicia, Catalonia, and Mallorca.'
                },
                recognitions: {
                    title: 'Recognitions',
                    p1: 'Official recognitions accompany, but above all, they are a guarantee. We are proud of our Craftsmanship Seal of the Valencian Community (DECA No. 2324) since 2000, as well as the Parcs Naturals Brand of the Font Roja Natural Park (2011) for our respectful processes.',
                    p2: 'We are members of the Craftsmanship Center of the Valencian Community and have been finalists in the Craftsmanship Awards. Our work has also reached major productions, having created hosiery for cinema, theater, and opera, including films like “Libertador” and “The Promise” (with an order of more than 200 pairs) or for the sopranos of the Teatro Real in Madrid. Behind each seal is a manual process that checks tension, steaming, and hand finishing before storing each sock in its recycled material packaging.'
                },
                howWeWork: {
                    title: 'How We Work',
                    p1: 'We reach people just like in the nineties, now reinforced by digital communication. We attend direct orders by phone, mail, or WhatsApp, since all our pieces are made to measure: we ask for leg height, calf thickness, and foot size. Our collections can also be found in specialized traditional clothing stores and we continue to be present at craft fairs and festive events. We maintain remote attention with national and international shipments, relying on social networks.'
                },
                textileMemory: {
                    title: 'Textile Memory',
                    p1: 'We share processes because textile memory needs to be public. We do this through reports in blogs like “Diario de una Peineta”, local press, and festival magazines, and through our participation in theater and film productions. We maintain a constant presence on Facebook and Instagram (@latortugueta.calcetines), where we show processes and news.',
                    p2: 'We make a call: if you have old socks, photographs, or family stories, we can document them and return them restored or replicated so they continue to be present in festivals, stages, and folklore groups.'
                }
            }
        }
    }
}
