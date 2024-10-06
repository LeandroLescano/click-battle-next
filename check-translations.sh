#!/bin/bash
# Color codes
RED="\033[31m"   # Red color for error messages
GREEN="\033[32m" # Green color for the progress bar
RESET="\033[0m"  # Reset to default color

# Function to check if a string is present as a key in a JSON file
function check_string_in_json() {
  local string="$1"
  local json_file="$2"

  # Escape the string for JSON search
  escaped_string=$(echo "$string" | sed 's/"/\\"/g')

  # Check if the string exists as a key in the JSON file
  if jq -e --arg text "$escaped_string" 'has($text)' "$json_file" > /dev/null; then
    return 0
  else
    return 1
  fi
}

# Find all .tsx and .ts files and count them
files=($(find . -type f \( -name "*.tsx" -o -name "*.ts" \) ! -path "*/node_modules/*" ! -path "*/tests/*"))
total_files=${#files[@]}


# Function to display a progress bar
function show_progress() {
  local progress=$((checked_files * 100 / total_files))
  local filled=$((progress / 2))        # Calculate number of fully filled blocks
  local partially_filled=$((progress % 2)) # 0 or 1 to determine if we need a partially filled block
  local unfilled=$((50 - filled - partially_filled)) # Remaining blocks

  printf "\r\033[32mProgress: ["  # Change progress bar color to green

  # Filled part
  for ((i=0; i<filled; i++)); do
    printf '█'
  done

  # Partially filled part (if any)
  if [ $partially_filled -eq 1 ]; then
    printf "▒░"
  fi

  # Unfilled part
  for ((i=0; i<unfilled; i++)); do
    printf '░'
  done

  printf "] %d%%\033[0m" "$progress"  # Reset color after progress bar
}

checked_files=0
untranslated_count=0

# Loop through each file
for file in "${files[@]}"; do
  while read -r match; do
    # Extract the text inside t("...") without t(" and ")
    text=$(echo "$match" | sed 's/^[^"]*"//; s/".*//')

    # Check if text contains double quotes
    if [[ "$match" == *'"'* ]]; then
      json_files=("i18n/locales/pr/translation.json" "i18n/locales/es/translation.json")

      all_present=true
      for json_file in "${json_files[@]}"; do
        if ! check_string_in_json "$text" "$json_file"; then
          all_present=false
          break
        fi
      done

      if ! $all_present; then
        printf "\r\033[K"  # Clear the current line
        echo -e "${RED}Text '$text' in '$file' is missing translations${RESET}"
        ((untranslated_count++))
      fi
    fi
  done < <(grep -oP '(?<=\s|{|[(])t\((.*?)\)' "$file")  # Use process substitution here

  ((checked_files++))
  show_progress
done

# Complete the progress bar
printf "\n${GREEN}Done! Checked %d files. Found %d untranslated keys.${RESET}\n" "$total_files" "$untranslated_count"
