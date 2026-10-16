# Cookies y tecnologías similares

**Borrador con pendientes — preparado el 15/10/2026. Integrado en la demo para revisión.**
Entrada en vigor: [PENDIENTE: aprobación e inventario final del dominio comercial].

## 1. Alcance

Este documento describe lo comprobado en la versión de revisión de Vicafoods y diferencia los controles de acceso de la demo de los que pueda utilizar el dominio comercial definitivo. Responsable/contacto: los identificados en la [Política de privacidad](/legal/privacidad), pendientes de cierre registral y operativo.

Las cookies son pequeños datos que el navegador conserva y envía bajo determinadas condiciones. Otros mecanismos, como almacenamiento local o scripts de terceros, pueden funcionar de manera diferente; no se consideran cookies por el solo hecho de existir.

## 2. Inventario comprobado y límites

| Mecanismo                                  | Proveedor/ámbito                                                            | Finalidad                                                  | Duración y comprobación                                                                                                                                  |
| ------------------------------------------ | --------------------------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cookie `_vercel_jwt`                       | Vercel, dominio de la demo protegida                                        | Reconocer acceso autorizado mediante el enlace de revisión | Se observó `Max-Age=604800` (7 días), Path=/, Secure, HttpOnly y SameSite=Lax en una sesión HTTP nueva. No se guardaron sus valores                      |
| Cookie `__prerender_bypass`                | Aplicación Next.js, sólo al habilitar una vista previa editorial autorizada | Seleccionar la vista de borradores del editor              | La ruta manual configura 1.800 segundos (30 minutos). Comprobación del código; no se activó ni verificó una sesión editorial nueva durante esta revisión |
| Herramienta de preview desde `vercel.live` | Vercel, entorno de revisión                                                 | Herramientas del entorno de revisión                       | Se observó su script en el navegador. [PENDIENTE: inventariar sus solicitudes, almacenamiento y duración efectivos]                                      |

La ruta experimental de previsualización integrada no constituye una función comercial verificada; no se atribuye su configuración a todos los visitantes. El acceso a la demo no equivale a una cuenta de comprador.

No se encontraron llamadas propias a `localStorage`/`sessionStorage` ni un cargador de Google Analytics o píxeles publicitarios en el código revisado. La analítica de clics permanece desactivada en el flujo observado. Esto no acredita ausencia absoluta de tecnologías del proveedor: el inventario de preview y el del dominio final deben completarse.

## 3. Enlaces y recursos

Los botones de WhatsApp son enlaces externos, no un chat incrustado. Abrirlos puede activar tecnologías del servicio de destino; el visitante decide si envía el mensaje. No se observó un iframe de WhatsApp o mapas en la página revisada.

Las fuentes se sirven desde el proyecto y las imágenes observadas se entregan desde el dominio de la web. La consulta de contenido a Sanity se realiza en el servidor en esta versión. No se atribuyen cookies de esos servicios al navegador sin comprobación.

## 4. Opciones reales del navegador

Puedes revisar y eliminar cookies desde la configuración de tu navegador. Borrar o bloquear una cookie de acceso puede hacer que debas volver a abrir el enlace autorizado o que deje de estar disponible la vista de borradores.

La versión revisada no tiene un panel propio para aceptar/rechazar categorías ni un enlace de retirada de preferencias. No se interpreta la navegación, el silencio o el uso de WhatsApp como consentimiento para seguimiento opcional. Antes de activar tecnologías que requieran consentimiento, se deberá informar y habilitar el control correspondiente; esta política no lo implementa.

## 5. Antes del dominio comercial

[PENDIENTE: confirmar dominio, retirar o configurar herramientas de preview, observar cookies/solicitudes en visita inicial y completar proveedores, finalidades, duración y activación]. Si se incorpora medición opcional, verificar los escenarios de rechazo, aceptación y retirada antes de describirlos como disponibles.

Para consultas sobre datos personales, el correo indicado es **vicafoods@gmail.com**. La información de privacidad y sus pendientes se encuentra en la [Política de privacidad](/legal/privacidad).
