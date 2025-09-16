/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class WallpaperMaker {
    // Element references
    private colorPreview: HTMLElement;
    private colorHex: HTMLElement;
    private hexInput: HTMLInputElement;
    private colorPickerBtn: HTMLButtonElement;
    private preview: HTMLElement;
    private sizeIndicator: HTMLElement;
    private deviceInfo: HTMLElement;
    private downloadBtn: HTMLButtonElement;
    private presetColorsContainer: HTMLElement;
    private resolutionGrid: HTMLElement;
    private snackbar: HTMLElement;
    private customModal: HTMLElement;
    private customWidth: HTMLInputElement;
    private customHeight: HTMLInputElement;
    private applyCustom: HTMLButtonElement;
    private cancelCustom: HTMLButtonElement;
    
    // State variables
    private currentColor: string;
    private currentResolution: [number, number];
    private snackbarTimeout: number | undefined;
    
    // Data
    private readonly presetColors: string[];
    private readonly commonResolutions: Array<{
        id: string;
        name: string;
        dimensions: [number, number];
        badge?: string;
    }>;
    
    constructor() {
        // Element references
        this.colorPreview = document.getElementById('colorPreview')!;
        this.colorHex = document.getElementById('colorHex')!;
        this.hexInput = document.getElementById('hexInput') as HTMLInputElement;
        this.colorPickerBtn = document.getElementById('colorPickerBtn') as HTMLButtonElement;
        this.preview = document.getElementById('preview')!;
        this.sizeIndicator = document.getElementById('sizeIndicator')!;
        this.deviceInfo = document.getElementById('deviceInfo')!;
        this.downloadBtn = document.getElementById('downloadBtn') as HTMLButtonElement;
        this.presetColorsContainer = document.getElementById('presetColors')!;
        this.resolutionGrid = document.getElementById('resolutionGrid')!;
        this.snackbar = document.getElementById('snackbar')!;
        this.customModal = document.getElementById('customModal')!;
        this.customWidth = document.getElementById('customWidth') as HTMLInputElement;
        this.customHeight = document.getElementById('customHeight') as HTMLInputElement;
        this.applyCustom = document.getElementById('applyCustom') as HTMLButtonElement;
        this.cancelCustom = document.getElementById('cancelCustom') as HTMLButtonElement;
        
        // State variables
        this.currentColor = '#76d1ff'; // Default to Material blue
        this.currentResolution = [1080, 2400]; // Default
        
        // Preset colors
        this.presetColors = [
            '#76d1ff', '#b6c9d7', '#ffb59c', '#c9c3a3',
            '#ff3b30', '#ff9500', '#ffcc00', '#34c759',
            '#8e8e93', '#1d1d1f', '#f2f2f7', '#FFFFFF',
            '#667eea', '#764ba2', '#f093fb', '#43e97b'
        ];
        
        // Common resolutions
        this.commonResolutions = [
            { id: 'detected', name: 'Your Device', dimensions: [0, 0], badge: 'badge-detected' },
            { id: 'pixel8', name: 'Pixel 8 Pro', dimensions: [1344, 2992], badge: 'badge-popular' },
            { id: 'galaxy23', name: 'Galaxy S23', dimensions: [1080, 2340], badge: 'badge-popular' },
            { id: 'fullhd', name: 'Full HD', dimensions: [1080, 1920] },
            { id: 'qhd', name: 'QHD', dimensions: [1440, 2560] },
            { id: 'custom', name: 'Custom', dimensions: [0, 0], badge: 'badge-custom' }
        ];
        
        this.initialize();
    }
    
    private initialize(): void {
        this.detectDevice();
        this.createPresetColors();
        this.createResolutionCards();
        this.setupEventListeners();
        this.setColor(this.currentColor);
        this.updateSizeIndicator();
        this.selectActiveResolutionCard('detected');
    }
    
    private detectDevice(): void {
        const userAgent = navigator.userAgent;
        let deviceType = 'Your Device';
        
        const w = Math.round(window.screen.width * window.devicePixelRatio);
        const h = Math.round(window.screen.height * window.devicePixelRatio);
        this.currentResolution = [w, h];

        if (/iPhone/i.test(userAgent)) deviceType = 'iPhone';
        else if (/iPad/i.test(userAgent)) deviceType = 'iPad';
        else if (/Android/i.test(userAgent)) deviceType = 'Android Device';
        
        this.deviceInfo.textContent = deviceType;
        
        const detectedCard = this.commonResolutions.find(r => r.id === 'detected');
        if (detectedCard) {
            detectedCard.name = deviceType;
            detectedCard.dimensions = this.currentResolution;
        }
    }
    
    private createPresetColors(): void {
        this.presetColorsContainer.innerHTML = '';
        this.presetColors.forEach(color => {
            const colorElement = document.createElement('div');
            colorElement.className = 'preset-color';
            colorElement.style.backgroundColor = color;
            colorElement.dataset.color = color;
            colorElement.setAttribute('role', 'option');
            colorElement.setAttribute('aria-label', color);
            
            colorElement.addEventListener('click', () => this.setColor(color));
            this.presetColorsContainer.appendChild(colorElement);
        });
    }
    
    private createResolutionCards(): void {
        this.resolutionGrid.innerHTML = '';
        this.commonResolutions.forEach(res => {
            const card = document.createElement('div');
            card.className = 'resolution-card';
            if (res.id === 'custom') card.classList.add('custom');
            card.dataset.id = res.id;
            card.setAttribute('role', 'radio');
            
            card.innerHTML = `
                <div class="resolution-name">${res.name}</div>
                <div class="resolution-dims">${res.id === 'custom' ? 'Set custom' : `${res.dimensions[0]} × ${res.dimensions[1]}`}</div>
                ${res.badge ? `<div class="resolution-badge ${res.badge}">${res.badge.split('-')[1]}</div>` : ''}
            `;
            
            card.addEventListener('click', () => {
                if (res.id === 'custom') this.showCustomModal();
                else this.setResolution(res.id);
            });
            this.resolutionGrid.appendChild(card);
        });
    }
    
    private setupEventListeners(): void {
        this.colorPickerBtn.addEventListener('click', () => this.showNativeColorPicker());
        this.hexInput.addEventListener('input', (e) => {
            const color = (e.target as HTMLInputElement).value;
            if (this.isValidHex(color)) this.setColor(color);
        });
        
        this.downloadBtn.addEventListener('click', () => this.downloadWallpaper());
        
        this.applyCustom.addEventListener('click', () => {
            const width = parseInt(this.customWidth.value);
            const height = parseInt(this.customHeight.value);
            
            if (this.isValidDimension(width) && this.isValidDimension(height)) {
                this.currentResolution = [width, height];
                this.updateSizeIndicator();
                this.selectActiveResolutionCard('custom');
                this.hideCustomModal();
                this.showSnackbar("Custom resolution set");
            } else {
                this.showSnackbar("Enter valid dimensions (100-10000)");
            }
        });
        this.cancelCustom.addEventListener('click', () => this.hideCustomModal());
    }
    
    private setColor(color: string): void {
        if (!this.isValidHex(color)) return;
        this.currentColor = color.toLowerCase();
        this.updateColorUI();
    }

    private updateColorUI(): void {
        const upperColor = this.currentColor.toUpperCase();
        this.colorHex.textContent = upperColor;
        this.colorPreview.style.backgroundColor = this.currentColor;
        this.preview.style.backgroundColor = this.currentColor;
        this.hexInput.value = upperColor;
        
        document.querySelectorAll('.preset-color').forEach(el => {
            const element = el as HTMLElement;
            const isSelected = element.dataset.color === this.currentColor;
            element.classList.toggle('selected', isSelected);
            element.setAttribute('aria-selected', isSelected.toString());
        });
    }
    
    private setResolution(resolutionId: string): void {
        const resolution = this.commonResolutions.find(r => r.id === resolutionId);
        if (resolution && resolutionId !== 'custom') {
            this.currentResolution = [...resolution.dimensions];
            this.updateSizeIndicator();
            this.selectActiveResolutionCard(resolutionId);
        }
    }

    private selectActiveResolutionCard(activeId?: string): void {
        let foundMatch = false;
        document.querySelectorAll('.resolution-card').forEach(cardEl => {
            const card = cardEl as HTMLElement;
            const resId = card.dataset.id!;
            let isSelected = activeId ? resId === activeId : false;

            if (!activeId && resId !== 'custom') {
                const resolution = this.commonResolutions.find(r => r.id === resId)!;
                if (resolution.dimensions[0] === this.currentResolution[0] &&
                    resolution.dimensions[1] === this.currentResolution[1]) {
                    isSelected = true;
                    foundMatch = true;
                }
            }
            
            card.classList.toggle('selected', isSelected);
            card.setAttribute('aria-checked', isSelected.toString());
        });

        // If no preset matches, highlight the 'custom' card
        if (!foundMatch && !activeId) {
            const customCard = this.resolutionGrid.querySelector('.resolution-card[data-id="custom"]');
            if (customCard) {
                customCard.classList.add('selected');
                customCard.setAttribute('aria-checked', 'true');
            }
        }
    }
    
    private updateSizeIndicator(): void {
        this.sizeIndicator.textContent = `${this.currentResolution[0]} × ${this.currentResolution[1]}`;
    }
    
    private isValidHex(color: string): boolean {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
    }
    
    private isValidDimension(dim: number): boolean {
        return !isNaN(dim) && dim >= 100 && dim <= 10000;
    }
    
    private showNativeColorPicker(): void {
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = this.currentColor;
        colorInput.style.visibility = 'hidden';
        document.body.appendChild(colorInput);
        colorInput.addEventListener('input', (e) => {
            this.setColor((e.target as HTMLInputElement).value);
        }, { once: true });
        colorInput.click();
        document.body.removeChild(colorInput);
    }
    
    private downloadWallpaper(): void {
        const [width, height] = this.currentResolution;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        
        ctx.fillStyle = this.currentColor;
        ctx.fillRect(0, 0, width, height);

        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.08)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        const originalContent = this.downloadBtn.innerHTML;
        this.downloadBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i><span>Creating...</span>`;
        this.downloadBtn.disabled = true;
        
        setTimeout(() => {
            const link = document.createElement('a');
            link.download = `wallpaper-${width}x${height}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            this.showSnackbar("Wallpaper downloaded!");
            
            setTimeout(() => {
                this.downloadBtn.disabled = false;
                this.downloadBtn.innerHTML = originalContent;
            }, 1500);
        }, 800);
    }
    
    private showSnackbar(message: string): void {
        const snackbarText = this.snackbar.querySelector('.snackbar-text')!;
        snackbarText.textContent = message;
        
        if (this.snackbar.classList.contains('show')) {
            // Already showing, just update text
            return;
        }

        clearTimeout(this.snackbarTimeout);
        this.snackbar.classList.add('show');
        this.snackbarTimeout = setTimeout(() => this.snackbar.classList.remove('show'), 3000);
    }
    
    private showCustomModal(): void {
        this.customModal.classList.add('show');
        this.customWidth.value = this.currentResolution[0].toString();
        this.customHeight.value = this.currentResolution[1].toString();
        setTimeout(() => this.customWidth.focus(), 300);
    }
    
    private hideCustomModal(): void {
        this.customModal.classList.remove('show');
    }
}

new WallpaperMaker();