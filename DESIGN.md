---
name: Vicafoods
description: Catálogo parrillero oscuro, tipografía condensada y acentos dorados.
colors:
  accent: "#e5b83d"
  paper: "#11100e"
  ink: "#f8f4eb"
  muted: "color-mix(in srgb, #f8f4eb 72%, #11100e)"
  line: "color-mix(in srgb, #e5b83d 24%, #11100e)"
  surface: "color-mix(in srgb, #f8f4eb 3.5%, #11100e)"
  brick-joint: "color-mix(in srgb, #e5b83d 8%, #11100e)"
  button-ink: "#23251f"
  gold-panel-ink: "#17130c"
  reference-label: "#11100ee8"
  reference-white: "#fff"
typography:
  display:
    fontFamily: "Barlow Condensed, Arial Narrow, Arial, sans-serif"
    fontSize: "clamp(3.8rem, 6.7vw, 6rem)"
    fontWeight: 600
    lineHeight: 0.96
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Barlow Condensed, Arial Narrow, Arial, sans-serif"
    fontSize: "clamp(2.8rem, 4.8vw, 4.6rem)"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Barlow Condensed, Arial Narrow, Arial, sans-serif"
    fontSize: "1.9rem"
    fontWeight: 600
    lineHeight: 1
  body:
    fontFamily: "Manrope Variable, Arial, Helvetica, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
  menu-title:
    fontFamily: "Manrope Variable, Arial, Helvetica, sans-serif"
    fontSize: "clamp(15px, 1.3vw, 19px)"
    fontWeight: 500
    lineHeight: 1.4
  label:
    fontFamily: "Manrope Variable, Arial, Helvetica, sans-serif"
    fontSize: "13px"
    fontWeight: 700
  reference-label:
    fontFamily: "Manrope Variable, Arial, Helvetica, sans-serif"
    fontSize: "0.7rem"
    lineHeight: 1.4
    letterSpacing: "0.04em"
rounded:
  sm: "0.25rem"
  md: "0.75rem"
  photograph: "0.45rem"
  hero: "0.65rem"
  hero-mobile: "0.5rem"
  category: "2px"
spacing:
  page-gutter: "clamp(1.25rem, 5vw, 3rem)"
  section-space: "clamp(4rem, 8vw, 7.5rem)"
  inline-gap: "1.5rem"
  grid-gap: "28px"
  small-gap: "8px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.button-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "15px 24px"
    height: "50px"
  button-inverse:
    backgroundColor: "{colors.button-ink}"
    textColor: "#f5f1e9"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "15px 24px"
    height: "50px"
  category-link:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.category}"
    padding: "10px 16px"
    height: "44px"
  category-link-current:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.paper}"
    rounded: "{rounded.category}"
    padding: "10px 16px"
    height: "44px"
  photograph:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.photograph}"
  reference-label:
    backgroundColor: "{colors.reference-label}"
    textColor: "{colors.reference-white}"
    typography: "{typography.reference-label}"
    padding: "0.25rem 0.55rem"
---

# Design System: Vicafoods

## Overview

**Creative North Star: "Negro, blanco y dorado; ladrillo sutil"**

La dirección confirmada combina un fondo negro cálido, letras blancas y dorado de horno. La tipografía condensada da presencia a la marca y a los títulos; Manrope mantiene legibles las descripciones, las categorías y los precios. El catálogo combina espacios amplios entre secciones con filas compactas para comparar platos y presentaciones.

Las fotografías aportan el color y el detalle del producto. El ladrillo aparece como un patrón geométrico de muy bajo contraste, dibujado con CSS directamente en el fondo de la página. Las juntas alternan entre filas; no se usa una fotografía de pared. Los movimientos de entrada, las respuestas de los enlaces y la fotografía que sigue al cursor acompañan la exploración. Por decisión expresa del usuario, las animaciones permanecen activas también con `prefers-reduced-motion: reduce`; el HTML, las acciones nativas y el espacio reservado de las imágenes siguen disponibles si JavaScript o su controlador fallan.

**Key Characteristics:**

- Fondo oscuro cálido, texto blanco y dorado en acciones, precios y detalles de marca.
- Títulos condensados en mayúsculas y texto de lectura en Manrope.
- Fotografía protagonista con encuadres reservados y esquinas discretas.
- Patrón de ladrillo sutil integrado en el fondo.
- Exploración fotográfica con ratón, teclado y tacto; animaciones activas por defecto.

Esta documentación captura el sistema implementado el 13 de octubre de 2026. La composición de la portada vive en `docs/design/vicafoods-home-2026-10-13.md`; la validación del contenido y el estado del canal de pedidos viven en `PRODUCT.md` y en la configuración del contenido. Esos estados operativos no definen el diseño de futuras superficies.

## Colors

La paleta se organiza alrededor del dorado y de neutrales cálidos; los valores del frontmatter representan el tema efectivo de Vicafoods.

### Primary

- **Dorado de horno (`accent`)**: acciones principales, precios, subtítulos de marca, categoría actual y foco. También produce las líneas cálidas al mezclarse con el fondo.

### Neutral

- **Negro cálido (`paper`)**: fondo principal. El nombre procede de la variable del componente compartido; en este tema representa el fondo oscuro.
- **Blanco cálido (`ink`)**: títulos y texto principal. En este tema representa el primer plano claro.
- **Blanco atenuado (`muted`)**: descripciones, información secundaria y enlaces de fotografía.
- **Línea dorada tenue (`line`)**: separadores y bordes del catálogo.
- **Junta de ladrillo (`brick-joint`)**: líneas casi negras para insinuar las hiladas sin competir con la lectura.
- **Superficie oscura elevada por tono (`surface`)**: fondo del menú y soportes de imagen.
- **Tinta para botón (`button-ink`)** y **tinta para panel dorado (`gold-panel-ink`)**: texto oscuro sobre superficies doradas.
- **Etiqueta referencial (`reference-label`, `reference-white`)**: soporte oscuro translúcido y texto blanco sobre fotografías.

No confundir los valores iniciales claros de la hoja compartida con el tema de Vicafoods: `FoodLanding` recibe `accent`, `background` y `foreground` y los asigna a las variables locales. Mantener las mezclas de superficie, línea y texto secundario vinculadas a ese tema.

## Typography

**Display Font:** Barlow Condensed, con Arial Narrow y Arial como alternativas.

**Body Font:** Manrope Variable, con Arial y Helvetica como alternativas.

El layout carga Manrope variable y Barlow Condensed en pesos 500, 600 y 700 mediante Fontsource. La condensación permite títulos grandes sin desplazar el contenido del catálogo; el cuerpo conserva un ritmo abierto y números fáciles de comparar.

### Hierarchy

- **Display:** título principal condensado, seminegrita y mayúsculas. Conserva interletrado ajustado y ancho de lectura acotado (14ch en escritorio; 15ch en la composición apilada).
- **Headline:** títulos de sección con la misma familia, peso y mayúsculas; las líneas se pueden envolver según el ancho real.
- **Title:** nombres de destacados. Las categorías usan una versión mayor (2.5rem en escritorio, 1.7rem hasta 680px).
- **Body:** descripciones en Manrope. El hero limita la medida a 42ch y los textos de sección a 60ch; no extender esas medidas por llenar una columna.
- **Menu title:** nombre de producto en peso medio, con el tamaño fluido del frontmatter. Los precios usan números tabulares y peso 600.
- **Label:** acciones principales. La firma del hero usa una variante menor (0.82rem), peso 700 e interletrado moderado (0.025em).
- **Reference label:** rótulo discreto sobre imagen; el texto debe conservar su legibilidad sobre fotografías variadas.

En el hero, hasta 1000px el display cambia a `clamp(3.4rem, 7.4vw, 5rem)`; hasta 760px usa `clamp(3.35rem, 10.2vw, 4.8rem)`. Los destacados reducen sus nombres a 1.3rem hasta 680px. Estas adaptaciones acompañan el cambio de composición.

## Layout

El contenedor de secciones centra el contenido con un ancho máximo (82.5rem) y resta dos márgenes fluidos. La cabecera tiene un máximo algo mayor (88.75rem). El ritmo vertical usa el token `section-space`; hasta 1000px las secciones regulares emplean 65px y hasta 680px, 50px. Las superficies con textura tienen su propio relleno para separar el texto del borde.

La portada actual distribuye texto y fotografía en dos columnas casi equilibradas (1.03fr / 0.97fr), con separación fluida y fotografía limitada a 35rem. Hasta 760px apila las columnas, hace la imagen más horizontal y convierte las líneas del negocio y la visita en una columna. Esta composición es una aplicación del sistema, no una plantilla obligatoria para todas las páginas.

Los destacados usan tres columnas con separación de 28px. Hasta 680px cada destacado combina una imagen y su texto en una fila. Si hay un único destacado, por encima de 680px usa una composición de dos columnas limitada a 50rem. Las galerías adaptan su rejilla al número de fotografías y se apilan en móvil.

El catálogo organiza cada categoría como introducción lateral y lista (1fr / 2fr), con separación de 50px que baja a 30px hasta 1000px. Hasta 680px la introducción queda encima de la lista. Cada fila mantiene nombre y detalles flexibles a la izquierda y precio a la derecha. No sacrificar la unidad o presentación del precio para comprimir la fila.

La navegación de categorías permanece adherida a 12px del borde superior y permite desplazamiento horizontal. Los enlaces mantienen un área mínima de 44px; el grupo al que apuntan reserva margen de desplazamiento (108px; 96px hasta 680px). La cabecera usa una navegación horizontal desplazable en móvil.

## Elevation & Depth

El sistema usa principalmente contraste tonal, fotografía y líneas finas. Las tarjetas de producto son superficies abiertas, sin cajas elevadas. Dos sombras tienen una función concreta: separar la fotografía principal del fondo y hacer legible la vista flotante que sigue al cursor.

### Shadow Vocabulary

- **Fotografía principal:** `0 1.25rem 3rem rgb(0 0 0 / 24%)`; sombra suave alrededor del encuadre principal.
- **Vista de cursor:** `0 16px 48px rgb(0 0 0 / 35%)`; separación de una fotografía transitoria sobre las filas del catálogo.
- **Acción flotante:** `drop-shadow(0 10px 20px rgb(0 0 0 / 18%))`; soporte de la acción cuando el contenido habilita esa ubicación.

El patrón rústico forma parte del fondo, con juntas de 1px y ladrillos de 160 × 48px. Dos gradientes cónicos de 160 × 96px desplazan las juntas verticales 80px entre filas; un gradiente lineal dibuja las horizontales. La mezcla `brick-joint` mantiene muy poco contraste. La franja de líneas del negocio y la visita son transparentes, por lo que el fondo se percibe continuo. No necesita imágenes, capas flotantes ni animación propia.

## Shapes

Las formas son rectangulares, con esquinas discretamente suavizadas. Los botones usan `sm`; la fotografía de producto y galería usa `photograph`; el hero usa `hero` y cambia a `hero-mobile` al apilarse. La navegación del catálogo usa esquinas casi rectas (`category`) dentro de un soporte con radio de 4px. Los radios del hero sustituyen el arco de la base compartida para este tema.

Las fotografías se recortan con `object-fit: cover`. Reservar la proporción antes de cargar: hero 1.04 en escritorio y 1.3 hasta 760px; producto 1.2; fotografía desplegable 14/11; galería 3/4 con variantes según composición. Mantener el espacio reservado evita saltos durante la carga y mantiene alineadas las entradas por scroll.

## Components

### Buttons

Acciones compactas, legibles y de alto contraste. El botón principal combina dorado y tinta oscura, el relleno del frontmatter y una altura mínima de 50px. En un panel dorado la variante inversa usa tinta oscura como fondo y blanco cálido como texto. La cabecera usa una versión compacta (11px 18px; altura mínima 43px).

Con ratón fino, el hover desplaza el botón hacia arriba (2px) y reduce suavemente su brillo; al activar, comprime a escala 0.97 durante 140ms. El foco usa un contorno dorado de 3px con separación de 4px. El estado deshabilitado usa fondo transparente, borde y texto legibles; habilitar o deshabilitar una acción corresponde al contenido, no a una regla de identidad.

### Navigation

La cabecera combina wordmark condensado y enlaces Manrope. El wordmark usa 2.4rem, peso 700, mayúsculas e interletrado ajustado; hasta 760px reduce a 2rem. Su firma usa dorado y letra espaciada (0.18em). Los enlaces revelan una línea dorada de 2px en hover; el foco conserva un contorno visible.

Las categorías son enlaces nativos en una franja oscura, horizontal y adherida. La categoría actual se expresa mediante `aria-current="location"`, fondo dorado y texto del color de fondo del tema. Hover y foco mantienen visible el estado actual. El área pulsable permanece en 44px aunque disminuyan el tamaño de letra y el relleno en móvil.

### Cards / Containers

Los destacados presentan una fotografía, nombre condensado, descripción y precio dorado, sin borde exterior ni sombra de tarjeta. La separación de la imagen al texto es 1.3rem en el tema actual. Las galerías comparten el recorte y las esquinas de fotografía; promociones y horarios usan líneas superiores para ordenar su información.

### Catalog rows and photograph disclosure

Las filas usan separadores finos y relleno vertical (19px; 16px hasta 680px). El nombre es Manrope de peso medio y el precio es dorado con números tabulares. Cuando existe imagen, un `<details>` nativo ofrece “Ver fotografía”, área pulsable de 44px e icono de flecha que gira al abrir. La fotografía desplegable se limita a 360px, tiene pie visible y funciona con teclado, tacto y sin JavaScript.

En equipos con ratón fino la misma imagen aparece en una vista que sigue al cursor. La vista no recibe eventos y permanece dentro del viewport; mide como máximo 280px por 300px, con una franja de texto de 78px. El seguimiento dura 0.2s; la entrada usa escala 0.97 a 1 y la salida 0.18s. Desaparece al abandonar la fila, desplazar la página, perder el foco de ventana o usar Escape/Tab. La alternativa desplegable sigue disponible. La vista flotante no se muestra con tacto o puntero grueso.

### Photograph and reference label

Conservar el encuadre y la atribución del activo utilizado. Las fotografías referenciales muestran un rótulo sobre fondo oscuro translúcido, y el desplegable de catálogo incluye pie “Imagen referencial”. El placeholder existente mantiene el mismo espacio y comunica fotografía pendiente; no sustituye datos del producto. Las imágenes de tarjetas, promociones y galería crecen levemente en hover (escala 1.02).

### Disclosure and section motion

Las preguntas frecuentes, cuando el contenido las incluye, usan `<details>` con separador y un símbolo que gira al abrir. No hay un patrón de campos de formulario implementado en esta superficie; definirlo a partir de un requisito real cuando haga falta.

Las entradas GSAP animan líneas de título y bloques desde opacidad 0.65 y desplazamiento vertical de 14px. La introducción del hero dura 0.72s y las entradas de sección 0.65s, con `power3.out` y separación de líneas de 0.07s. Los bloques por scroll empiezan en `top 88%`, reproducen al entrar y revierten al salir hacia arriba. Evitar animar simultáneamente un bloque y otro antecesor suyo. SplitText recalcula al cambiar fuente o ancho; los desplegables provocan una nueva medición. El contenido permanece visible antes de inicializar y vuelve al estado nativo si el controlador falla.

## Do's and Don'ts

### Do:

- **Do** usar el tema negro, blanco cálido y dorado en acciones, precios y marca.
- **Do** combinar títulos Barlow Condensed en mayúsculas con descripciones y datos Manrope.
- **Do** reservar las proporciones fotográficas y mantener identificadas las imágenes referenciales.
- **Do** ofrecer enlaces y desplegables nativos, foco visible y áreas de interacción de al menos 44px en el catálogo.
- **Do** mantener las animaciones activas también con movimiento reducido emulado y verificar que el contenido siga disponible si falla el controlador.
- **Do** mantener el patrón CSS de ladrillo de muy bajo contraste y comprobar la lectura sobre el fondo.

### Don't:

- **Don't** sustituir el patrón CSS por una fotografía de pared ni aumentar sus juntas hasta convertirlas en el foco de la página.
- **Don't** usar los valores claros iniciales de la hoja compartida como si fueran el tema efectivo de Vicafoods.
- **Don't** ocultar contenido esperando a que se inicialicen las animaciones.
- **Don't** hacer que la vista de cursor sea la única manera de inspeccionar una fotografía.
- **Don't** presentar una fotografía referencial como un plato auténtico del negocio.
- **Don't** convertir el estado privado de la demo o la activación pendiente de pedidos en una restricción visual global.
