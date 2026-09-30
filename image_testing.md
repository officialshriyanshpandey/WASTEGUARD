# WasteGuard image integration testing

- Always use base64-encoded JPEG, PNG, or WEBP images for tests and API requests.
- Images must contain real visual features such as objects, edges, textures, or shadows; do not use blank or solid-color images.
- If the source is another format, transcode it to PNG or JPEG and update the MIME type.
- For animated images, use the first frame only.
- Resize large images to reasonable bounds before upload.
- Verify `/api/ai/analyze` returns `detected_issue`, `waste_type`, `severity`, `estimated_fill_level`, `recommended_action`, `confidence`, and `analysis_mode`.
- A provider failure must return a clearly labelled `demo_fallback` result rather than claiming real AI accuracy.