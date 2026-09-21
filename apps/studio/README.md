# Reference Studio scaffold

`npm run dev --workspace=@pato-food/studio` starts the editor after setting `SANITY_STUDIO_PROJECT_ID` and `SANITY_STUDIO_DATASET` to an authorized, isolated project. `SANITY_STUDIO_PREVIEW_ORIGIN` defaults to `http://localhost:3000`; the Presentation tool uses `/api/draft/enable` and Sanity's expiring Preview URL Secret handshake. The fallback project ID is an inert placeholder, not a provisioned project. No account creation, dataset import or deployment is performed by starting Studio.

Eight document types; fixed singleton IDs and restricted singleton actions. These UI restrictions do not replace dataset permissions, query validation or launch approval. Hosted preview authentication, roles, real webhook delivery and asset-ingestion checks still require deployment evidence. Upload accepts raster formats; file size/dimensions/animation validation remains a documented ingestion gate, not a claimed browser enforcement.
