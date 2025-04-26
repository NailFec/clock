document.addEventListener('DOMContentLoaded', () => {
    const countdownDisplay = document.getElementById('countdown-display');
    const estimatedEndTimeDisplay = document.getElementById('estimated-end-time');
    const optionButtons = document.querySelectorAll('.option-button');
    const customMinutesInput = document.getElementById('custom-minutes');
    const customStartButton = document.getElementById('custom-start');
    const pauseButton = document.getElementById('pause-button');
    const endButton = document.getElementById('end-button');
    const progressBar = document.getElementById('progress-bar');

    let countdownInterval;
    let endTime;
    let isPaused = false;
    let remainingTime = 0;
    let totalDuration = 0;
    let updateEndTimeInterval;

    if ('Notification' in window) {
        Notification.requestPermission();
    }

    progressBar.style.width = '100%';

    function updateStartButtonState() {
        const inputValue = customMinutesInput.value.trim();
        const isValid = inputValue !== '' && parseInt(inputValue) > 0;
        customStartButton.disabled = !isValid;
    }

    updateStartButtonState();

    function formatTime(totalSeconds) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const formattedHours = hours.toString().padStart(2, '0');
        const formattedMinutes = minutes.toString().padStart(2, '0');
        const formattedSeconds = seconds.toString().padStart(2, '0');

        if (hours > 0) {
            return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
        } else {
            return `${formattedMinutes}:${formattedSeconds}`;
        }
    }

    function formatDateTime(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    function updateEstimatedEndTime() {
        if (isPaused) {
            const now = new Date();
            const estimatedEnd = new Date(now.getTime() + remainingTime * 1000);
            estimatedEndTimeDisplay.textContent = `will end at: ${formatDateTime(estimatedEnd)}`;
        } else {
            estimatedEndTimeDisplay.textContent = `will end at: ${formatDateTime(endTime)}`;
        }
    }

    function startCountdown(minutes) {
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }

        if (updateEndTimeInterval) {
            clearInterval(updateEndTimeInterval);
        }

        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        const durationInSeconds = minutes * 60;
        remainingTime = durationInSeconds;
        totalDuration = durationInSeconds;

        endTime = new Date();
        endTime.setSeconds(endTime.getSeconds() + durationInSeconds);

        progressBar.style.width = '100%';
        progressBar.classList.remove('paused');

        document.body.classList.add('countdown-active');

        isPaused = false;
        pauseButton.textContent = 'Pause';
        countdownDisplay.classList.remove('paused');
        estimatedEndTimeDisplay.classList.remove('paused');

        updateEstimatedEndTime();

        updateEndTimeInterval = setInterval(updateEstimatedEndTime, 1000);

        updateCountdown();

        countdownInterval = setInterval(updateCountdown, 1000);
    }

    function sendNotification(title, body) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: body,
                icon: '/favicon.ico'
            });
        }
    }

    function updateCountdown() {
        if (!isPaused) {
            remainingTime--;

            if (totalDuration > 0) {
                const progressPercentage = (remainingTime / totalDuration) * 100;
                progressBar.style.width = `${progressPercentage}%`;
            }
        }

        if (remainingTime <= 0) {
            clearInterval(countdownInterval);
            countdownDisplay.textContent = '00:00';
            progressBar.style.width = '0%';

            countdownDisplay.classList.add('completed');

            const minutes = Math.floor(totalDuration / 60);
            sendNotification('the countdown is over', `the countdown for ${minutes} minutes is over`);

            setTimeout(() => {
                resetCountdown();
            }, 6000);

            return;
        }

        countdownDisplay.textContent = formatTime(remainingTime);
    }

    function resetCountdown() {
        clearInterval(countdownInterval);
        if (updateEndTimeInterval) {
            clearInterval(updateEndTimeInterval);
        }
        document.body.classList.remove('countdown-active');
        countdownDisplay.classList.remove('completed');
        countdownDisplay.classList.remove('paused');
        progressBar.classList.remove('paused');
        estimatedEndTimeDisplay.classList.remove('paused');
        progressBar.style.width = '0%';
        customMinutesInput.value = '';
        updateStartButtonState();
    }

    optionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const minutes = parseInt(button.getAttribute('data-minutes'));
            startCountdown(minutes);
        });
    });

    customMinutesInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const minutes = parseInt(customMinutesInput.value);
            if (minutes > 0) {
                startCountdown(minutes);
            } else {
                showNotification();
            }
        }
    });

    customMinutesInput.addEventListener('input', updateStartButtonState);

    customStartButton.addEventListener('click', () => {
        if (!customStartButton.disabled) {
            const minutes = parseInt(customMinutesInput.value);
            if (minutes > 0) {
                startCountdown(minutes);
            } else {
                showNotification();
            }
        }
    });

    function showNotification() {
        const notification = document.getElementById('notification');
        notification.classList.add('show');

        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    pauseButton.addEventListener('click', () => {
        isPaused = !isPaused;
        pauseButton.textContent = isPaused ? 'Continue' : 'Pause';

        if (isPaused) {
            countdownDisplay.classList.add('paused');
            progressBar.classList.add('paused');
            estimatedEndTimeDisplay.classList.add('paused');
        } else {
            countdownDisplay.classList.remove('paused');
            progressBar.classList.remove('paused');
            estimatedEndTimeDisplay.classList.remove('paused');

            endTime = new Date();
            endTime.setSeconds(endTime.getSeconds() + remainingTime);
        }

        updateEstimatedEndTime();
    });

    endButton.addEventListener('click', () => {
        resetCountdown();
    });
});