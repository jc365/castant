# Generación de PDF — TFM Memoria

## Prerrequisitos

```bash
# Instalar pandoc
sudo apt install pandoc

# Instalar motor LaTeX (requerido para PDF)
sudo apt install texlive-xetex texlive-fonts-recommended texlive-plain-generic

# Opcional: más fuentes y paquetes
sudo apt install texlive-latex-extra
```

## Generar PDF con índice

```bash
cd docu/memoria

pandoc TFM_memoria_final.md \
  -o TFM_memoria_final.pdf \
  --pdf-engine=xelatex \
  --toc \
  --toc-depth=3 \
  -V geometry:margin=2.5cm \
  -V fontsize=12pt \
  -V documentclass=report \
  -V mainfont="DejaVu Sans" \
  -V monofont="DejaVu Sans Mono"
```

## Parámetros

| Parámetro | Descripción |
|-----------|-------------|
| `--pdf-engine=xelatex` | Motor LaTeX para generación de PDF |
| `--toc` | Genera automáticamente el índice de contenidos |
| `--toc-depth=3` | Incluye hasta H3 en el índice |
| `-V geometry:margin=2.5cm` | Márgenes de 2.5cm |
| `-V fontsize=12pt` | Tamaño de fuente base |
| `-V documentclass=report` | Clase de documento (capítulos) |
| `-V mainfont` | Fuente principal |
| `-V monofont` | Fuente para código |

## Opciones avanzadas

### Con portada personalizada

```bash
pandoc TFM_memoria_final.md \
  -o TFM_memoria_final.pdf \
  --pdf-engine=xelatex \
  --toc \
  --toc-depth=3 \
  -V geometry:margin=2.5cm \
  -V fontsize=12pt \
  -V documentclass=report \
  --include-before-title-page=portada.tex
```

### Sin diagramas Mermaid (si xelatex falla con bloques de código)

Los diagramas Mermaid se incluyen como bloques de código fenced. Si el PDF no los renderiza como imágenes, se pueden:

1. **Opción A:** Exportar los diagramas como imágenes PNG manualmente y referenciarlos
2. **Opción B:** Usar `--listings` para que se muestren como código monocromático

```bash
pandoc TFM_memoria_final.md \
  -o TFM_memoria_final.pdf \
  --pdf-engine=xelatex \
  --toc \
  --toc-depth=3 \
  --listings \
  -V geometry:margin=2.5cm \
  -V fontsize=12pt
```

## Notas

- El marcador `<!-- TOC -->` en el Markdown indica dónde pandoc insertará el índice
- Los bloques Mermaid se renderizan como código monocromático en el PDF (pandoc no tiene renderer Mermaid nativo)
- Para diagramas renderizados, exportar como PNG desde Mermaid Live Editor e insertar con `![Caption](path/to/image.png)`
