#!/bin/bash
# Post a PDF file to the debug conversion server and save a page as PNG
# Usage: bash PostPDFToDebugServer.sh <input.pdf> [page_number] [format]

if [ -z "$1" ]; then
	echo "Usage: $0 <input_pdf_file> [page_number] [format]"
	echo "  Posts a PDF file to the debug server for page extraction."
	echo "  page_number: The page to extract (default: 1)"
	echo "  format: png or jpg (default: png)"
	echo "  The debug server (Harness.js) must be running on port 8765."
	exit 1
fi

INPUT_FILE="$1"
PAGE="${2:-1}"
FORMAT="${3:-png}"

if [ ! -f "$INPUT_FILE" ]; then
	echo "Error: File not found: $INPUT_FILE"
	exit 1
fi

# Validate format
if [ "$FORMAT" != "png" ] && [ "$FORMAT" != "jpg" ]; then
	echo "Error: Format must be 'png' or 'jpg'"
	exit 1
fi

# Extract the base filename without extension
BASENAME=$(basename "$INPUT_FILE")
NAME_NO_EXT="${BASENAME%.*}"

# Generate timestamp: YYYY_MM_DD_HH_MM_SS_MS
TIMESTAMP=$(date +%Y_%m_%d_%H_%M_%S)
# Append milliseconds (cross-platform via python3)
MS=$(python3 -c "import datetime; print(f'{datetime.datetime.now().microsecond // 1000:03d}')")
TIMESTAMP="${TIMESTAMP}_${MS}"

OUTPUT_FILE="${NAME_NO_EXT}_page${PAGE}_${TIMESTAMP}.${FORMAT}"

echo "Extracting page ${PAGE} from ${INPUT_FILE} (PDF) -> ${OUTPUT_FILE} (${FORMAT}) ..."

curl -s -X POST \
	--data-binary @"${INPUT_FILE}" \
	-H "Content-Type: application/octet-stream" \
	http://127.0.0.1:8765/conversion/1.0/pdf-to-page-${FORMAT}/${PAGE} \
	-o "${OUTPUT_FILE}"

if [ $? -eq 0 ] && [ -f "$OUTPUT_FILE" ] && [ -s "$OUTPUT_FILE" ]; then
	echo "Success: ${OUTPUT_FILE}"
else
	echo "Error: Conversion failed."
	exit 1
fi
