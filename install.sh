#!/bin/bash

# First ensure we're in the correct directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Extension UUID
UUID="nepali-calendar-gs-extension@aryog.info.np"
EXTENSIONS_DIR="$HOME/.local/share/gnome-shell/extensions"

# Check if metadata.json exists
if [ ! -f "./$UUID/metadata.json" ]; then
	echo "Error: metadata.json not found! Extension cannot be installed without metadata.json"
	exit 1
fi

# Check if screenshot exists
if [ ! -f "./$UUID/screenshot.png" ]; then
	echo "Warning: screenshot.png not found! Your extension won't have a preview image in GNOME Extensions"
fi

if ! command -v glib-compile-schemas &> /dev/null; then
	echo "Error: glib-compile-schemas not found. Please install glib2.0-dev or similar package."
	exit 1
fi

# Remove existing extension if it exists
if [ -d "$EXTENSIONS_DIR/$UUID" ]; then
	echo "Removing existing extension..."
	rm -rf "$EXTENSIONS_DIR/$UUID"
fi

# Create extensions directory if it doesn't exist
mkdir -p "$EXTENSIONS_DIR"

# Compile schemas
echo "Compiling schemas..."
glib-compile-schemas ./$UUID/schemas/

# Copy extension files directly
echo "Installing extension..."
cp -r "./$UUID" "$EXTENSIONS_DIR/"

# Compile schemas in the installed location
cd "$EXTENSIONS_DIR/$UUID/schemas" && glib-compile-schemas .

# Enable the extension
echo "Enabling extension..."
gnome-extensions enable $UUID 2>/dev/null || true

echo "Extension installed successfully!"

# Create a temporary script to enable the extension after login
ENABLE_SCRIPT="/tmp/enable-nepali-calendar.sh"
cat > "$ENABLE_SCRIPT" << EOL
#!/bin/bash
sleep 10  # Wait for GNOME Shell to fully start
gnome-extensions enable $UUID
rm "\$0"  # Self-delete this script
EOL
chmod +x "$ENABLE_SCRIPT"

# Add the script to autostart
mkdir -p "$HOME/.config/autostart"
cat > "$HOME/.config/autostart/enable-nepali-calendar.desktop" << EOL
[Desktop Entry]
Type=Application
Name=Enable Nepali Calendar
Exec=$ENABLE_SCRIPT
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
EOL

# Restart GNOME Shell
if [ "$XDG_SESSION_TYPE" = "x11" ]; then
	echo "Restarting GNOME Shell..."
	busctl --user call org.gnome.Shell /org/gnome/Shell org.gnome.Shell Eval s 'Meta.restart("Restarting…")' || \
	echo "Please press Alt+F2, type 'r' and press Enter to restart GNOME Shell"
else
	echo "Please log out and log back in to activate the extension"
	gnome-session-quit --logout --no-prompt
fi

exit 0
