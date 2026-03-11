// ===================================================================================
//          MÓDULO DE BARRA LATERAL REDIMENSIONÁVEL
// ===================================================================================

document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const resizer = document.getElementById('sidebarResizer');
    const content = document.querySelector('.content-area');
    const logoText = document.getElementById('sidebarLogoText');
    const toggleIcon = document.getElementById('sidebarToggleIcon');
    
    let isResizing = false;
    const minWidth = 60;
    const defaultWidth = 260;
    const hideTextThreshold = 180;
    const showAWThreshold = 120;

    // Recupera largura salva
    const savedWidth = localStorage.getItem('sidebarWidth');
    if (savedWidth) {
        applySidebarWidth(parseInt(savedWidth));
    }

    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        resizer.classList.add('resizing');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        
        let newWidth = e.clientX;
        if (newWidth < minWidth) newWidth = minWidth;
        if (newWidth > 400) newWidth = 400; // Limite máximo razoável

        applySidebarWidth(newWidth);
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            resizer.classList.remove('resizing');
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
            
            const currentWidth = parseInt(sidebar.style.width);
            localStorage.setItem('sidebarWidth', currentWidth);
        }
    });

    function applySidebarWidth(width) {
        sidebar.style.width = width + 'px';
        content.style.marginLeft = width + 'px';

        // Comportamento do texto
        if (width <= minWidth) {
            sidebar.classList.add('collapsed');
            sidebar.classList.remove('hide-text');
            toggleIcon.className = 'fas fa-chevron-right';
            logoText.style.display = 'none';
        } else {
            sidebar.classList.remove('collapsed');
            toggleIcon.className = 'fas fa-chevron-left';
            
            if (width < hideTextThreshold) {
                sidebar.classList.add('hide-text');
            } else {
                sidebar.classList.remove('hide-text');
            }

            // Comportamento do Título (CONTROLADORIA -> AW -> Desaparece)
            if (width < showAWThreshold) {
                logoText.style.display = 'none';
            } else if (width < 200) {
                logoText.innerText = 'AW';
                logoText.style.display = 'block';
            } else {
                logoText.innerText = 'CONTROLADORIA';
                logoText.style.display = 'block';
            }
        }
    }

    window.toggleSidebarMode = function() {
        const currentWidth = parseInt(sidebar.style.width) || defaultWidth;
        
        // Se a barra estiver desconfigurada (nem min nem default), volta para o padrão
        if (currentWidth !== minWidth && currentWidth !== defaultWidth) {
            applySidebarWidth(defaultWidth);
            localStorage.setItem('sidebarWidth', defaultWidth);
            return;
        }

        if (currentWidth === minWidth) {
            // Se estiver no modo reduzido, volta para o modo normal
            applySidebarWidth(defaultWidth);
            localStorage.setItem('sidebarWidth', defaultWidth);
        } else {
            // Se estiver no modo normal, vai para o modo reduzido
            applySidebarWidth(minWidth);
            localStorage.setItem('sidebarWidth', minWidth);
        }
    };
});
