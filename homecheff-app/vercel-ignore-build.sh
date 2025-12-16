#!/bin/bash
# Ignore Build Step Script voor Vercel
# Dit script bepaalt of een build moet worden uitgevoerd

# Check of er een specifieke commit message is die deployment forceert
if [[ "$VERCEL_GIT_COMMIT_MESSAGE" == *"[DEPLOY]"* ]] || [[ "$VERCEL_GIT_COMMIT_MESSAGE" == *"[deploy]"* ]]; then
  echo "✅ - Build wordt uitgevoerd (DEPLOY flag gevonden)"
  exit 1  # Voer build uit
fi

# Check of er een environment variable is die deployment forceert
if [ "$FORCE_DEPLOY" == "true" ]; then
  echo "✅ - Build wordt uitgevoerd (FORCE_DEPLOY=true)"
  exit 1  # Voer build uit
fi

# Standaard: negeer de build
echo "🛑 - Build genegeerd (gebruik [DEPLOY] in commit message of FORCE_DEPLOY=true om te deployen)"
exit 0  # Negeer build

