#!/bin/bash
# Post a JPG file to the debug conversion server and save the PNG result
# Usage: bash PostJPGToDebugServer.sh <input.jpg>

if [ -z "$1" ]; then
	echo "Usage: $0 <input_jpg_file>"
	echo "  Posts a JPG file to the debug server for conversion to PNG."
	echo "  The debug server (Harness.js) must be running on port 8765."
	exit 1
fi

INPUT_FILE="$1"

if [ ! -f "$INPUT_FILE" ]; then
	echo "Error: File not found: $INPUT_FILE"
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

OUTPUT_FILE="${NAME_NO_EXT}_${TIMESTAMP}.png"

echo "Converting ${INPUT_FILE} (JPG) -> ${OUTPUT_FILE} (PNG) ..."

curl -s -X POST \
	--data-binary @"${INPUT_FILE}" \
	-H "Content-Type: application/octet-stream" \
	http://127.0.0.1:8765/conversion/1.0/image/jpg-to-png \
	-o "${OUTPUT_FILE}"

if [ $? -eq 0 ] && [ -f "$OUTPUT_FILE" ] && [ -s "$OUTPUT_FILE" ]; then
	echo "Success: ${OUTPUT_FILE}"
else
	echo "Error: Conversion failed."
	exit 1
fi
