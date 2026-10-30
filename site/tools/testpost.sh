#!/bin/sh
# Ersatz für sendmail beim Formulartest: legt jede Mail als Datei ab.
mkdir -p "$(dirname "$0")/testpost"
cat > "$(dirname "$0")/testpost/mail-$(date +%s%N).eml"
