# Originality, provenance, and licensing

PhaseOne is an **original QSOL-IMC FPS and a technical demonstration of native-to-browser compilation**. It is not a port or reproduction of any commercial title.

## Technical inspiration versus protected expression

It is acceptable to study public descriptions of compilation pipelines, WebAssembly, browser-host interfaces, streaming, input systems, and rendering architectures. That does **not** grant rights to reuse proprietary game source, levels, character designs, trademarks, names, dialogue, models, music, textures, voice acting, extracted data, or private implementation material.

The first demonstrator will rely on procedural geometry and original ideas, so it needs no existing game assets. Similar genres and broad mechanical patterns are not a licence to copy specific protected expression.

## Asset intake record

Before adding distributable assets, keep a machine-readable or documented record of:

- path, descriptive title, author/creator, creation method and date;
- whether authored for PhaseOne, generated, imported, or adapted;
- original source and licence/permission evidence for imported material;
- required notices/attribution, applicable restrictions, and distribution permission;
- checksum and asset revision, ideally tied to the source commit.

If origin or redistribution rights cannot be established, **do not ship the asset**. Preserve the investigation record and use an original replacement.

## Code and toolchain

Repository source code is currently licensed under **Apache-2.0**. This does not automatically grant rights to third-party materials. Keep required third-party notices and verify compatibility before incorporating outside libraries or assets. Compiler-generated glue or runtime support may carry distinct licence/notice obligations; document those in the distributable bundle.

## Release review

Before publication, check: original narrative/world/names; provenance for every shipped file; third-party notices; trademarks and project branding; secrets and telemetry; and consistency between licence text and claims. Do not imply that being playable in a browser grants the right to redistribute someone else's game.

This is a practical project policy, not a legal opinion.
