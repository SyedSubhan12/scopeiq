#!/bin/bash
# ===================================================
# ScopeIQ Environment Setup Script
# ===================================================
# Usage:
#   ./scripts/setup-env.sh local     # Set up local development
#   ./scripts/setup-env.sh clean     # Remove all env symlinks
# ===================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

setup_local() {
    print_info "Setting up LOCAL development environment..."
    
    # Check if .env.local exists
    if [ ! -f "$ROOT_DIR/.env.local" ]; then
        print_warning ".env.local not found!"
        print_info "Creating from template..."
        cp "$ROOT_DIR/.env.local.example" "$ROOT_DIR/.env.local"
        print_success "Created .env.local from template"
        print_warning "Please edit .env.local with your actual credentials!"
    else
        print_success "Found existing .env.local"
    fi
    
    # Remove existing symlinks
    rm -f "$ROOT_DIR/apps/web/.env"
    rm -f "$ROOT_DIR/apps/api/.env"
    
    # Create symlinks to .env.local
    ln -s "$ROOT_DIR/.env.local" "$ROOT_DIR/apps/web/.env"
    ln -s "$ROOT_DIR/.env.local" "$ROOT_DIR/apps/api/.env"
    
    print_success "Created symlink: apps/web/.env → .env.local"
    print_success "Created symlink: apps/api/.env → .env.local"
    
    echo ""
    print_info "Environment variables configured for LOCAL development"
    print_info "Frontend will call API at: http://localhost:4000"
    echo ""
    print_info "To start development servers:"
    echo -e "   ${GREEN}pnpm dev${NC}"
    echo ""
}

clean_env() {
    print_info "Cleaning up environment symlinks..."
    
    rm -f "$ROOT_DIR/apps/web/.env"
    rm -f "$ROOT_DIR/apps/api/.env"
    
    print_success "Removed apps/web/.env"
    print_success "Removed apps/api/.env"
    
    echo ""
    print_warning "Environment symlinks removed"
    print_info "Run './scripts/setup-env.sh local' to set up again"
    echo ""
}

show_status() {
    print_info "Current environment setup status:"
    echo ""
    
    if [ -L "$ROOT_DIR/apps/web/.env" ]; then
        TARGET=$(readlink "$ROOT_DIR/apps/web/.env")
        print_success "apps/web/.env → $(basename $TARGET)"
    else
        print_error "apps/web/.env not linked"
    fi
    
    if [ -L "$ROOT_DIR/apps/api/.env" ]; then
        TARGET=$(readlink "$ROOT_DIR/apps/api/.env")
        print_success "apps/api/.env → $(basename $TARGET)"
    else
        print_error "apps/api/.env not linked"
    fi
    
    echo ""
    if [ -f "$ROOT_DIR/.env.local" ]; then
        print_success ".env.local exists"
    else
        print_warning ".env.local not found"
    fi
    
    echo ""
}

# Main script
case "${1:-status}" in
    local)
        setup_local
        ;;
    clean)
        clean_env
        ;;
    status)
        show_status
        ;;
    *)
        echo "Usage: $0 {local|clean|status}"
        echo ""
        echo "Commands:"
        echo "  local   - Set up local development environment"
        echo "  clean   - Remove environment symlinks"
        echo "  status  - Show current environment status"
        exit 1
        ;;
esac
