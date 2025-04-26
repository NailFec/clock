document.addEventListener('DOMContentLoaded', () => {
    const countdownDisplay = document.getElementById('countdown-display');
    const estimatedEndTimeDisplay = document.getElementById('estimated-end-time');
    const optionsPanel = document.getElementById('options-panel');
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

    // 初始化时确保进度条宽度为100%
    progressBar.style.width = '100%';

    // Check input and update start button state
    function updateStartButtonState() {
        const inputValue = customMinutesInput.value.trim();
        const isValid = inputValue !== '' && parseInt(inputValue) > 0;
        customStartButton.disabled = !isValid;
    }

    // Initial check for button state
    updateStartButtonState();

    // Format time for display (similar to time page)
    function formatTime(totalSeconds) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        // Format with leading zeros
        const formattedHours = hours.toString().padStart(2, '0');
        const formattedMinutes = minutes.toString().padStart(2, '0');
        const formattedSeconds = seconds.toString().padStart(2, '0');

        // Display format depends on duration
        if (hours > 0) {
            return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
        } else {
            return `${formattedMinutes}:${formattedSeconds}`;
        }
    }

    // 格式化日期时间为HH:MM:SS格式
    function formatDateTime(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    // 更新预计结束时间显示
    function updateEstimatedEndTime() {
        if (isPaused) {
            // 暂停状态：当前时间 + 剩余时间
            const now = new Date();
            const estimatedEnd = new Date(now.getTime() + remainingTime * 1000);
            estimatedEndTimeDisplay.textContent = `will end at: ${formatDateTime(estimatedEnd)}`;
        } else {
            // 正常状态：显示固定的结束时间
            estimatedEndTimeDisplay.textContent = `will end at: ${formatDateTime(endTime)}`;
        }
    }

    // Start countdown with given minutes
    function startCountdown(minutes) {
        // Clear any existing countdown
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }

        // 清除现有的结束时间更新定时器
        if (updateEndTimeInterval) {
            clearInterval(updateEndTimeInterval);
        }

        // Calculate end time
        const durationInSeconds = minutes * 60;
        remainingTime = durationInSeconds;
        totalDuration = durationInSeconds;

        // 计算预计结束时间
        endTime = new Date();
        endTime.setSeconds(endTime.getSeconds() + durationInSeconds);

        // Reset progress bar before showing it
        progressBar.style.width = '100%';
        progressBar.classList.remove('paused');

        // Show countdown display and hide options
        document.body.classList.add('countdown-active');

        // Reset pause state
        isPaused = false;
        pauseButton.textContent = 'Pause';
        countdownDisplay.classList.remove('paused');
        estimatedEndTimeDisplay.classList.remove('paused');

        // 更新预计结束时间显示
        updateEstimatedEndTime();

        // 设置更新预计结束时间的定时器（当处于暂停状态时需要实时更新）
        updateEndTimeInterval = setInterval(updateEstimatedEndTime, 1000);

        // Update display immediately
        updateCountdown();

        // Set interval to update countdown
        countdownInterval = setInterval(updateCountdown, 1000);
    }

    // Update countdown display
    function updateCountdown() {
        if (!isPaused) {
            remainingTime--;

            // Update progress bar width
            if (totalDuration > 0) {
                const progressPercentage = (remainingTime / totalDuration) * 100;
                progressBar.style.width = `${progressPercentage}%`;
            }
        }

        if (remainingTime <= 0) {
            // Countdown finished
            clearInterval(countdownInterval);
            countdownDisplay.textContent = '00:00';
            progressBar.style.width = '0%';

            // Optional: Add some visual indication that countdown is complete
            countdownDisplay.classList.add('completed');

            // Reset after a delay
            setTimeout(() => {
                resetCountdown();
            }, 3000);

            return;
        }

        // Update display
        countdownDisplay.textContent = formatTime(remainingTime);
    }

    // Reset countdown and show options
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

    // Event listeners for option buttons
    optionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const minutes = parseInt(button.getAttribute('data-minutes'));
            startCountdown(minutes);
        });
    });

    // Event listener for custom input
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

    // Event listener for input changes to update button state
    customMinutesInput.addEventListener('input', updateStartButtonState);

    // Event listener for custom start button
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

    // Show notification function
    function showNotification() {
        const notification = document.getElementById('notification');
        notification.classList.add('show');

        // Hide notification after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // Event listener for pause/continue button
    pauseButton.addEventListener('click', () => {
        isPaused = !isPaused;
        pauseButton.textContent = isPaused ? 'Continue' : 'Pause';

        // Toggle paused class for visual indication
        if (isPaused) {
            countdownDisplay.classList.add('paused');
            progressBar.classList.add('paused');
            estimatedEndTimeDisplay.classList.add('paused');
        } else {
            // 从暂停恢复时，重新计算预计结束时间
            countdownDisplay.classList.remove('paused');
            progressBar.classList.remove('paused');
            estimatedEndTimeDisplay.classList.remove('paused');

            // 重新计算预计结束时间
            endTime = new Date();
            endTime.setSeconds(endTime.getSeconds() + remainingTime);
        }

        // 更新预计结束时间显示
        updateEstimatedEndTime();
    });

    // Event listener for the end button
    endButton.addEventListener('click', () => {
        resetCountdown();
    });
});
