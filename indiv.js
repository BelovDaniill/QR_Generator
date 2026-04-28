document.addEventListener('DOMContentLoaded', () => {
    const generate = document.getElementById('generate');
    const download = document.getElementById('download');
    const clearHistory = document.getElementById('clear-history');
    const qrText = document.getElementById('qr-text');
    const historyList = document.getElementById('history-list');

    // Загружаем историю из LocalStorage
    renderHistory();

    // Функция проверки контраста и инверсии
    function checkContrast() {
        const dark = document.getElementById('color-dark').value;
        const light = document.getElementById('color-light').value;
        const warning = document.getElementById('contrast-warning');

        const getLuminance = (hex) => {
            const rgb = parseInt(hex.substring(1), 16);
            const r = (rgb >> 16) & 0xff;
            const g = (rgb >> 8) & 0xff;
            const b = (rgb >> 0) & 0xff;
            return 0.2 * r + 0.7 * g + 0.07 * b;
        };

        const lumDark = getLuminance(dark);
        const lumLight = getLuminance(light);
        const diff = Math.abs(lumLight - lumDark);

        if (diff < 100) {
            warning.style.display = 'block';
            warning.style.background = 'rgba(245, 68, 68, 0.2)';
            warning.style.color = '#fca5a5';
            warning.innerText = 'Низкий контраст: код может не считаться!';
        } else if (lumDark > lumLight) {
            warning.style.display = 'block';
            warning.style.background = 'rgba(245, 68, 68, 0.2)';
            warning.style.color = '#fcd34d';
            warning.innerText = 'Инверсия: некоторые сканеры плохо читают светлый код на темном фоне';
        } else {
            warning.style.display = 'none';
        }
    }

    // Основная функция генерации
    function generateQR() {
        const text = qrText.value.trim();
        const darkColor = document.getElementById('color-dark').value;
        const lightColor = document.getElementById('color-light').value;
        const container = document.getElementById('qr-container');

        if (!text) return;

        try {
            const qr = qrcode(0, 'M');
            // unescape + encodeURIComponent для поддержки русского языка
            qr.addData(unescape(encodeURIComponent(text)));
            qr.make();

            const moduleCount = qr.getModuleCount();
            const table = document.createElement('table');

            for (let r = 0; r < moduleCount; r++) {
                const row = document.createElement('tr');
                for (let c = 0; c < moduleCount; c++) {
                    const cell = document.createElement('td');
                    cell.style.backgroundColor = qr.isDark(r, c) ? darkColor : lightColor;
                    row.appendChild(cell);
                }
                table.appendChild(row);
            }

            container.innerHTML = '';
            container.appendChild(table);
            download.style.display = 'block';

            addToHistory(text);
            checkContrast();

        } catch (e) {
            console.error(e);
            alert("Ошибка генерации");
        }
    }

    // Скачивание PNG
    async function downloadImage() {
        const container = document.getElementById('qr-container');
        const canvas = await html2canvas(container);
        const link = document.createElement('a');
        link.download = 'qrcode.png';
        link.href = canvas.toDataURL();
        link.click();
    }

    // Работа с историей
    function addToHistory(text) {
        let history = JSON.parse(localStorage.getItem('qr_history') || '[]');
        if (!history.includes(text)) {
            history.unshift(text);
            history = history.slice(0, 5);
            localStorage.setItem('qr_history', JSON.stringify(history));
            renderHistory();
        }
    }

    function renderHistory() {
        const history = JSON.parse(localStorage.getItem('qr_history') || '[]');
        historyList.innerHTML = history.map(item => `<li>${item}</li>`).join('');
        historyList.querySelectorAll('li').forEach(li => {
            li.onclick = () => {
                qrText.value = li.innerText;
                generateQR();
            };
        });
    }

    // Слушатели событий
    generate.addEventListener('click', generateQR);
    download.addEventListener('click', downloadImage);
    
    clearHistory.addEventListener('click', () => {
        localStorage.removeItem('qr_history');
        renderHistory();
    });
    
    qrText.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') generateQR();
    });

    // --- ЛОГИКА ПО УМОЛЧАНИЮ
    if (!qrText.value) {
        qrText.value = "https://belovdaniill.github.io/QR_Generator/"; 
    }
    generateQR(); // Генерируем код сразу при открытии страницы
});