document.addEventListener('DOMContentLoaded', () => {
    const timeDisplay = document.getElementById('time-display');
    const timezonePanel = document.getElementById('timezone-panel');
    const timezoneInput = document.getElementById('timezone-input');
    const formatToggle = document.getElementById('format-toggle');
    const displayToggle = document.getElementById('display-toggle');

    let currentTimezoneOffset = 8;

    let displayMode = 0;

    let is24HourFormat = true;

    function updateTime() {
        const now = new Date();

        const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);

        const selectedTime = new Date(utcTime + (3600000 * currentTimezoneOffset));

        let hours = selectedTime.getHours();
        const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
        const seconds = selectedTime.getSeconds().toString().padStart(2, '0');
        const milliseconds = selectedTime.getMilliseconds().toString().padStart(3, '0');

        let period = '';
        if (!is24HourFormat) {
            period = hours >= 12 ? ' PM' : ' AM';
            period = ` <span class="period">${period}</span>`;
            hours = hours % 12 || 12;
        }

        const formattedHours = hours.toString().padStart(2, '0');

        let timeString = '';

        switch (displayMode) {
            case 0:
                timeString = `${formattedHours}:${minutes}:${seconds}${period}`;
                break;
            case 1:
                timeString = `${formattedHours}:${minutes}:${seconds}<span class="milliseconds">.${milliseconds}</span>${period}`;
                break;
            case 2:
                timeString = `${formattedHours}:${minutes}${period}`;
                break;
        }

        timeDisplay.innerHTML = timeString;
    }

    function updateInterval() {
        if (window.timeInterval) {
            clearInterval(window.timeInterval);
        }

        const interval = displayMode === 1 ? 50 : 1000;
        window.timeInterval = setInterval(updateTime, interval);
    }

    updateTime();
    updateInterval();

    document.addEventListener('mousemove', (e) => {
        const threshold = window.innerHeight * 0.8;

        if (e.clientY > threshold) {
            timezonePanel.classList.add('visible');
        } else {
            timezonePanel.classList.remove('visible');
        }
    });

    timezoneInput.addEventListener('input', () => {
        const inputValue = timezoneInput.value.trim();

        if (inputValue.startsWith('UTC+')) {
            currentTimezoneOffset = parseFloat(inputValue.replace('UTC+', '')) || 0;
        } else if (inputValue.startsWith('UTC-')) {
            currentTimezoneOffset = -parseFloat(inputValue.replace('UTC-', '')) || 0;
        } else {
            if (inputValue.toLowerCase().startsWith('utc')) {
                currentTimezoneOffset = 0;
            } else {
                timezoneInput.value = 'UTC+8';
                currentTimezoneOffset = 8;
            }
        }

        updateTime();
    });

    displayToggle.addEventListener('click', () => {
        displayMode = (displayMode + 1) % 3;

        switch (displayMode) {
            case 0:
                displayToggle.textContent = 'S';
                displayToggle.title = 'Display seconds (current) - click to show milliseconds';
                break;
            case 1:
                displayToggle.textContent = 'MS';
                displayToggle.title = 'Display milliseconds (current) - click to show minutes only';
                break;
            case 2:
                displayToggle.textContent = 'M';
                displayToggle.title = 'Display minutes only (current) - click to show seconds';
                break;
        }

        updateInterval();
        updateTime();
    });

    formatToggle.addEventListener('click', () => {
        is24HourFormat = !is24HourFormat;

        formatToggle.textContent = is24HourFormat ? '24h' : '12h';
        formatToggle.title = is24HourFormat ? 'Using 24-hour format (current) - click to switch to 12-hour format' : 'Using 12-hour format (current) - click to switch to 24-hour format';

        updateTime();
    });
});
