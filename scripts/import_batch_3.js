const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
});

const rawData = `17/12/2025	1859 M	Montlleó en Pardalet T/42 - alt 39 gemelo 35 - 175 111
17/12/2025	1858 M	Benamer T/35 - 190 150 lletra M
10/11/2025	.1809 N	Els Millars T/37 gemelo normal lletra A en or resta colors tela
	1913 M	T/41 lletra A colors en clients sencillet
09/01/2026	1890 M	Belluga en lletra T/43 - 100 lletra F
23/12/2025	1874 M	Santa Faz T/40 100 - brodat negre rivetejar 125 lletra B
30/12/2025	1881 M	Mimosa - T/31 189 cenefa 139 ratlls 172 es un xiquet
		mandado directo, cosido por Loli
28/11/2025	.1822	El Comtat T/37 - 188 144 - 32 gemelo
28/11/2025	.1822	Canyis T/37 - 121 - 34,5 gemelo
10/01/2026	1891 M	Savina T/45 - gemelo 46 alto 45 - 100 118 177
17/01/2025	1902 M	Set Llunes T/39 - 198 132
20/11/2025	.1789 M	El Comtat T/44 - 100 138 - alto 50 gemelo 39 
04/12/2025	1840 M	4- niño 11 años talla zapato 36, medida grosor 26cm largo 36 cm color calcetín Beige 189 garbanzo color 185 (coral)
04/12/2025	1840 M	3- niña 12 años talla zapato 37 ,medida grosor 34 cm largo 40cm color calcetín 195 (negro) garbanzo 178( dorado) 
04/12/2025	1840 M	1-niña 7 años,talla zapato 32 ,medidas grosor 23cm largo 33cm color calcetín 130(granate)Garbanzos 175(verde)
04/12/2025	1840 M	2- niña 11 años Talla zapato 38 ,medida grosor 33cm ,largo 42 cm color calcetín 198 (gris ) y garbanzos rosa 128 
31/12/2025	1883 M	Cigrons T/36-37 - 152 151 comanda 3951
12/12/2025	1850 M	Mutxamel T/38 - 148 greca 149 189 - Referencia 3889
01/12/2025	.1822 N	Cap Roig T/38 - alt 35 - gemelo 38 - 116 199
01/12/2025	.1822 N	La Safor T/38 - alt 35 - gemelo 38 - 175 100
30/12/2025	1880 N	El Comtat T/42 alt 49 gemelo 34 - 176 189
12/12/2025	1853 M	El Comtat T/42 - 148 105
26/12/2025	1875 M	Montlleo, T/41 - alto 42 gemelo 30 144 140
		5 per a cosir
07/10/2025	.1768	Liles T/37 alto 34 gemelo 45 - 199 flors 134 141
17/01/2025	1904 M	Belluga lletra alta T/42 alt 43 garro 31 - 196 110 lletra J
11/12/2025	1847 M	Serra del Cid () T/38 gemelo 38 alt 41 - 100  - flors 119 - Fulle or i 111 Lletra J 119
29/01/2026	1916 M	Fonteta T/39 -  199 - 127 flors or vell i el puntet 128
07/01/2026	1888 M	Caudete T/46 - 189 153
		mandado directo, cosido por Loli
04/12/2025	1840 M	4 - La Senia T/43  - 130 cenefa 171 i ratlles 189  alt 50 gemelo 41,5
04/12/2025	1840 M	5 - Vall de Pop T/43 - 118 - cuadritos 189 - alt 50 gemelo 41,5
26/12/2025	.1824 M	Calcetín 3 - Fonts  n 38 “5 - alto 48 fondo 197 - 142 -
	.1824 M	L'Albir T/43 - 199 talon punta i dibuj 127 puntos 195
01/12/2025	.1833 M	Fuente Cobre T/41 pierna delgadita adulto - CMC
		Fondo 141, Rayas , dibujo e iniciales 118 resto rayas 176
15/12/2025	1854 M	Alberri T/37 - 174 - comanda 3772
05/01/2026	1886 M	Savina T39 - alt 46 el pie le mide 25 cms. 119 189 179 - comanda 3785
20/01/2025	1911 M	Benicarlo T/37 - 189 177 - alt 37 gemelo 30
14/01/2026	1898 M	Benissiva T/41 - gemelo 36 alt 41 - 197 109 199 
06/02/2026	1920 N	Montlleo T/43 alt 51 gemelo 35 - 190 185
20/01/2025	1907 M	Savina T/45 - 143 100 128 - comanda 3843
07/01/2026	1886 M	L'Albir T/43 - 186 176 199 comanda 3973
		13 per a cosir
20/01/2025	1906 N	Benimeli T/38 - lletra E en plata alt 43 gemelo 37 colors tela Base J
20/01/2025	1906 N	Benimeli T/38 - lletra E en plata alt 43 gemelo 37 colors tela Base J
17/01/2025	1901 N	Santa Catalina T/41 lletra M - brodar or i 127 - Base H
03/12/2025	1819 N	Benamer T/45 - PARA BORDAR - 190 172 alto 50 lletres DB
29/01/2026	1914 M	La Fuentona T/39 - alto 38 - gemelo 45 muy gordo 190 192
17/01/2025	1904 M	Cati T/42  Largo 43 Gemelo 31 .- 100 118
13/01/2026	1897 M	Casa Alta T/36 - 188 ratlles 142 183
05/02/2026	1919 M	Fuente Cobre T/41 -  197 127 130 -  I M O  - alt 50 gemelo 33
		4 per a cosir
17/12/2025	1859 M	Cigrons T/39 - gemelo 34 - alt 43 - 189 166
14/01/2026	1898 M	Utiel - T/43 - alt 41 - gemelo 38 - 199 119 175
14/01/2026	1898 M	Ginebral - T/44 - 100 176 - alt 50 - maluc 39
25/11/2025	.1825 M	Confrides T/37 - gemelo 35 alt 40 142 - ratlles gras 119 ratlles xicotetes 140
02/12/2025	.1837 M	Llombay T/31 - alto 37 gemelo 27 - 127 149 es una nena
20/01/2025	1908 M	Granero T/42 - gemelo 35 - 163
17/01/2025	1903 M	Utiel T/46 - gemelo alt 196 ratlla 187 cenefa 119
12/12/2025	1850 M	Albir talla 39 - 187 greca 176  picas 189 - Referencia 3893
15/12/2025	1854 M	Taronger T/36 - 129 169 - referencia 3901
14/01/2026	1895 M	Taronger T/44 - 177 186 111 - pedido 3978
07/01/2026	1886 M	L'Albir T/43 - 186 176 199 comanda 3973
26/11/2025	.1812 M	Confrides T/41 - alt 51 - gemelo 41 - 189 - 186 159
	1880 M	Cava Gran T/42 - 195 182 vore si esta enviat
12/01/2025	1891 M	Vall de Pop T/45 - 130 197 ratlla 189
12/01/2025	1891 M	Taronger T/26 - 136 148 189
28/11/2025	.1820 N	Benamer sin bordar T/41,5 - alto 43 - gemelo 37,5 - 196 173
13/01/2026	1897 M	Mutxamel bebe de Benicarlo planta peu 9 cms. alto 15 cms.141 100
12/01/2026	1892 M	L'Albir T/39 - gemelo 37 alt 50 - 189 194 123
09/01/2026	1889 N	Torero T/26 -  177 118 - verdet son 2 germanets per a Falles en verd 
14/01/2026	1894 N	Castalla T/44 - 194 - dibuix 190 - les ratlles 177 - alt 46 - maluc 44
14/01/2026	1893 M	Castalla T/43 - gemelo 37 alt 43 - 166 128 189
		4 per a cosir
09/01/2026	.1928 M	Benissiva T/41 - 189 129 rayas 159 pedido 3983
13/01/2026	.1928 M	Benissiva T/35 - 146 180 rartlles 185 - pedido 3987
20/01/2025	1907 M	Taronger T/36 - 129 127 189 - comanda 4021
09/01/2026	.1928 M	Fuente Cobre T/37 - 190 130 ratlles 145 - lletres MMC 145 - pedido 3979
13/01/2026	1897 M	Casa Alta T/36 - 188 ratlles 142 183
13/01/2026	1897 M	Casa Alta T/30 - 188 ratlles 142 183
07/10/2025	.1768 N	Cigrons T/41 - alto 40 gemelo 42 - 187 118
20/01/2025	1910 M	Cava Gran T/44 - 120 142
10/01/2026	1891 M	Cigons T/41 - 185 contorno 42 - alto 45
10/01/2026	1891 M	Vall de Pop T/46 - 159 ratlles 199 agujeros 198 alto 47 - gemelo 42
14/01/2026	1891 M	Castalla T/34 - nene - 149 -dibujo 195 - ratles 132
20/01/2025	1910 M	Savina T/41 - 190 flor 195 ratlla 118
06/02/2026	1920 N	Montlleo T/43 alt 51 gemelo 35 - 190 185
18/01/2025	1905 N	Alt del Castellet T/39 - 123 - dibuix 191
09/01/2026	1889 N	Torero T/26 177 118 - verdet son 2 germanets per a Falles en verd
16/01/2026	1899 M	Liles T/38 -  140 blau fosc i or
23/01/2026	1912 M	Taronger T/43 - 146 106 - alt 40 gemelo 39
06/02/2026	1921 N	Castalla T/43 - 176 118 190 - 41,5 gemelo - 4 cms. mas de alto
31/01/2026	1918 M	Set Llunes T/44 - 189 186
20/01/2025	1910 M	Taronger T/41 - 129 ondas 149 resto 100
20/01/2025	1910 M	Taronger T/41 - 129 ondas 149 resto 100
20/01/2025	1910 M	Taronger T/21 - 129 ondas 149 resto 100
20/01/2025	1910 M	Taronger T/22 - 129 ondas 149 resto 100
09/02/2026	1922 M	Benamer T/43 -  100 153 - 
31/01/2026	1918 M	Val de Pop T/42 - 100 punta, talon y puntitos 185 raya 111
09/02/2026	1922 M	Vall de Pop T/43 - 145 raya y cuadros 196 cuadros con agujero 146
12/01/2026	1891 M	Vall de Pop T/46 - 197 forats 148 ratlles 100
17/01/2025	1902 N	Mimosa T/38 -  152 119 148 - alto 34 gemelo 36 lletres JVV
16/01/2026	1900 N	Chovar T/34 - 100 fletxes 177 ratllts de dal i acabament 188 - alt 33 garro 24
09/02/2026	1923 M	Clasico T/46 - 100 140 alto 54 gemelo 40
20/02/2025	1931 M	Cigrons T/46 alto 51 del 175
[19:17, 31/3/2026] Inmaculada García Silvestre: 18/01/2025	1905 N	Alt del Castellet T/39 - 123 - dibuix 191
		1 per a cosir
18/02/2026	1929 M	3 Fonts T/45 -  190  118 lletra J color 145 - alto 45 - gemelo 42
26/02/2026	1933 M	Fonteta T/38 - 128 flors brodades en grisos i verds - pujar 2 cms dibuix
[19:18, 31/3/2026] Inmaculada García Silvestre: 05/11/2025	.1808	Datilera T/36 - gemelo 30,5 - alto 36 - fondo 174 - brodar en 152/153 i verd oliva 176
		lletra G en blau marino
11/11/2025	.1808	Benamer T/42 - gemelo 39 alto 45 - 130 127 bordar letra J del 1127
		2 bases
		Rebuts dia 10/03/2026 en Alcoi per Viaexpress per Jesus Chacón
26/02/2026	1933 M	Fuente Cobre T/42 - 198 100 130 sin letras
03/03/2026	1935 M	Fuente Cobre T/43 - 199 145 190 - 3 cms mes alt JF
26/02/2026	1933 M	Savina T/38 - 189 141
03/03/2026	1935 M	Set Llunes T/46 - 189 177 - 12 cms mes alt
16/02/2026	1926 M	L'Albir T/44 - alto43 - gemelo 38 - 199 dibujo 177 puntos i rayas 190
16/02/2026	1926 M	La Fuentona T/39 - alto 40 - gemelo 37 - 152 128
16/02/2026	1926 M	Casa Alta T/38 -  alto 43 - gemelo 41 - 177 rayas 130 lo otro 187
09/01/2026	.1928 M	Fuente Cobre T/38 - 190 130 ratlles 145 - lletres MMC 145 - pedido 3979
03/03/2026	1937 N	Cigrons T/39 - 106 100 - 5 cms. mas de alto
03/03/2026	1937 N	Casa Alta T/43 -  118 172 127  gemelo 45 - alto 50
03/03/2026	1938 M	Cigrons T/42- 186 188
14/01/2026	1894 N	Benissiva T/44-45 - 194 - dibuix 190 - les ratlles 177 - alt 46 - maluc 44
09/02/2026	1922 M	Set Llunes T/42 - 189 137
09/02/2026	1922 M	Set Llunes T/42 - 189 193
03/03/2026	1936 N	Torero T/31 - alto 22 gemelo 20 es un nene 177 118 flecha alta hasta 4 cms arriba
[19:18, 31/3/2026] Inmaculada García Silvestre: 20/02/2025	1932 N	Mola d'Ares T/41,5 - alto 43 - gemelo 37,5 -  100 175
[19:18, 31/3/2026] Inmaculada García Silvestre: 02/02/2026	1917 N	Peuco negro T/47 - 199 - altura normal
09/01/2026	1889 N	Torero T/26 -  177 118 - verdet son 2 hermanitos alto 20
09/01/2026	1889 N	Torero T/26 -  177 118 - verdet son 2 hermanitos alto 20
03/03/2026	1935 M	Base llisa T/39 - 140 - colors tela
09/02/2026	1924 M	Taronger T/40 - alto 43 - maluc 43 - 105 129 127 
26/02/2026	1933 M	Taronger - T/23 - 125 detalets 151
26/02/2026	1933 M	Taronger - T/24 - 125 detalets 151
03/03/2026	1935 M	Cap Roig T/42 - 188 190
[19:19, 31/3/2026] Inmaculada García Silvestre: 21/03/2026	1941 N	Torero T/44 alto 51 - 150 100
		sense cosir
09/02/2026	1925 N	Vall de Pop  - T/41 - 119 177 - alt 43 - gemelo 36
09/02/2026	1925 N	Vall de Pop  - T/41 - 119 177 - alt 43 - gemelo 36
19/03/2026	1936 N	Mimosa T/ 41 - 175 190 110 - gemelo 37,5 - alto 42
30/12/2025	1882 N	Cardona - reproducció T/44 gemelo 45 alt 48 - 100
18/02/2026	.1928 M	Benissiva T/39 - 100 127 ratlles 176 - pedido 4064
		5 cosidos a 1,5
21/03/2026	1940 N	Els Millars T/33 alto 37 gemelo 26 dibujo alto color 100 del 12 lletra P brodar blaus
21/03/2026	1940 N	Marxivol T/33 Alto 37 - gemelo 26 color 120 del 12 brodar flors admeller
26/02/2026	1934 N	Estrago T/39,5- lletra S al lado blanco rayas azules discretas alto 57 gemelo 27
		141 145 contorno brodat 148
		Marie Sarthe - Impasse Maurin - 13380 - Plan-de-Cuques
29/01/2026	1915 N	Barx T/37 -  alt 45 gemelo 34 tot 100 bordat i tot lletra C de Clara Base 3
19/03/2026	1939 N	Castelar T/36 lletra B com els de Berta or i plata 100 del 12 base A
19/03/2026	1937 N	Montlleo T/34 - 100 - 177 - gemelo 36 alto 36	Victor La Torre
19/03/2026	1937 N	La Fuentona T/37 - 199 118 gemelo 37 alto 40	Victor La Torre
19/03/2026	1938 N	Fuente Cobre T/42 - PTC - 199 como el original	Pau La Torre
24/03/2026	1941 M	Savina T/39 - 118 110 176 - F/2	Rosa Tomas
24/03/2026	1941 M	Taronger T/42 - 187 129 152 - F/4	Rosa Tomas
30/03/2026	1942 M	Mutxamel T/39 - alto 40 gemelo 35 - 127 163	Mar de Fils
30/03/2026	1942 M	Castelar T/39 - 100 - alto 40 gemelo 35 - bordar 177 i or lletra R or	Mar de Fils
30/03/2026	1942 M	Liles T/39 - 100 - alto 40 gemelo 35 - bordar 119 118 oro	Mar de Fils
31/03/2026	1943 M	Savina 127 - hojas i picas 196 rayas 119	Rosa Tomas
		- Daniella: 34	Rosa Tomas
		- Jimena Mompó: 37	Rosa Tomas
		- Lola : 39	Rosa Tomas
		- María : 39	Rosa Tomas
		- Clau: 35	Rosa Tomas
		- Martina 34	Rosa Tomas
		- Jimena Noguera: 36	Rosa Tomas
		- Vega: 34	Rosa Tomas
		- Alba: 34	Rosa Tomas
		- Aitana: 34	Rosa Tomas
		- Nuria: 39	Rosa Tomas
		- Olga : medias 38 * 	Rosa Tomas`;

async function importOrders() {
    console.log('Starting custom order import to Supabase...');
    const records = [];
    const lines = rawData.split('\n');
    let lastDate = null;
    let lastOrderId = null;
    let lastClient = '';
    
    // fetch products for fuzzy matching just like the main script does
    const { data: products } = await supabase.from('products').select('id, name, price');

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].replace(/\[\d{1,2}:\d{2},\s*\d{1,2}\/\d{1,2}\/\d{4}\]\s*Inmaculada García Silvestre:\s*/g, '');
        if (!line.trim()) continue;

        let parts = line.split('\t').filter(p => p.trim() !== '');
        
        // Is this an observation for previous order?
        if (line.match(/^\t+/) || parts.length === 1 || (parts.length === 2 && parts[0].includes('-'))) {
             if (records.length > 0) {
                 records[records.length - 1].delivery_date = (records[records.length - 1].delivery_date + ' / ' + line.trim()).trim();
             }
             continue;
        }

        let dateStr = '';
        let idStr = '';
        let itemStr = '';
        let clientStr = '';

        // Safely check if parts[0] is a date DD/MM/YYYY
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(parts[0].trim())) {
            dateStr = parts[0].trim();
            idStr = parts[1] ? parts[1].trim() : '';
            itemStr = parts[2] ? parts[2].trim() : '';
            clientStr = parts[3] ? parts[3].trim() : '';
        } else {
            idStr = parts[0] ? parts[0].trim() : '';
            itemStr = parts[1] ? parts[1].trim() : '';
            clientStr = parts[2] ? parts[2].trim() : '';
        }

        if (dateStr) lastDate = dateStr; else dateStr = lastDate;
        if (idStr) lastOrderId = idStr; else idStr = lastOrderId;
        if (clientStr) lastClient = clientStr; else clientStr = lastClient;

        let cleanOrderId = idStr ? idStr.replace(/\s*[MN]$/i, '').replace(/^\./, '').trim() : '';

        // Real wholesale boolean
        let isWholesale = idStr && / M$/i.test(idStr.trim());

        let productName = itemStr || '';
        if (productName.includes(' T/')) productName = productName.split(' T/')[0].trim();
        else if (productName.includes(' - ')) productName = productName.split(' - ')[0].trim();
        
        let size = '';
        const sizeMatch = (itemStr||'').match(/T\/(\d+(?:[.,]\d+)?)/i);
        if (sizeMatch) size = sizeMatch[1];
        
        let date = null;
        if (dateStr) {
            const dateParts = dateStr.split('/');
            if (dateParts.length === 3) {
                 const d = dateParts[0].padStart(2,'0');
                 const m = dateParts[1].padStart(2,'0');
                 let y = dateParts[2];
                 if (y.length === 2) y = '20'+y;
                 date = `${y}-${m}-${d}`;
            }
        }
        
        let productId = null;
        let basePrice = 0;
        if (productName && products) {
            const exact = products.find(p => p.name.toLowerCase() === productName.toLowerCase());
            if (exact) {
                productId = exact.id;
                basePrice = exact.price || 0;
            }
            else {
                 const partial = products.find(p => p.name.toLowerCase().includes(productName.toLowerCase()) || productName.toLowerCase().includes(p.name.toLowerCase()));
                 if (partial) {
                    productId = partial.id;
                    basePrice = partial.price || 0;
                 }
            }
        }

        let finalPrice = basePrice;
        if (isWholesale) {
            finalPrice = basePrice * 0.5;
        }
        
        records.push({
            order_id: cleanOrderId,
            date: date,
            client: clientStr || '-',
            product_name: productName,
            size: size,
            details: itemStr,
            delivery_date: '',
            status: 'pending',
            product_id: productId,
            product_price: finalPrice,
            is_wholesale: !!isWholesale
        });
    }

    console.log(`Parsed ${records.length} valid orders. Pushing to Supabase...`);
    const { data, error } = await supabase.from('sales').insert(records);
    if (error) {
         console.error('Error inserting:', error);
    } else {
         console.log('Successfully inserted into sales table!');
    }
}

importOrders().catch(console.error);
