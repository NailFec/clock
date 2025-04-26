document.addEventListener('DOMContentLoaded', () => {
    const stopwatchDisplay = document.getElementById('stopwatch-display');
    const startButton = document.getElementById('start-button');
    const stopButton = document.getElementById('stop-button');
    const endButton = document.getElementById('end-button');

    let startTime = 0;
    let elapsedTime = 0;
    let stopwatchInterval;
    let isRunning = false;
    let isPaused = false;

    function formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const ms = milliseconds % 1000;

        const formattedMinutes = minutes.toString().padStart(2, '0');
        const formattedSeconds = seconds.toString().padStart(2, '0');
        const formattedMs = ms.toString().padStart(3, '0');

        return `${formattedMinutes}:${formattedSeconds}<span class="milliseconds">.${formattedMs}</span>`;
    }

    function updateStopwatch() {
        const currentTime = Date.now();
        const timeToDisplay = elapsedTime + (currentTime - startTime);

        stopwatchDisplay.innerHTML = formatTime(timeToDisplay);
    }

    function startStopwatch() {
        if (!isRunning) {
            startTime = Date.now();
            stopwatchInterval = setInterval(updateStopwatch, 10);
            isRunning = true;
            isPaused = false;

            startButton.style.display = 'none';
            stopButton.textContent = 'Pause';
            stopButton.style.display = 'inline-block';
            stopwatchDisplay.classList.remove('paused');
        }
    }

    function stopStopwatch() {
        if (isRunning && !isPaused) {
            clearInterval(stopwatchInterval);
            elapsedTime += Date.now() - startTime;
            isPaused = true;

            stopButton.textContent = 'Continue';
            stopwatchDisplay.classList.add('paused');
        } else if (isPaused) {
            startTime = Date.now();
            stopwatchInterval = setInterval(updateStopwatch, 10);
            isPaused = false;

            stopButton.textContent = 'Pause';
            stopwatchDisplay.classList.remove('paused');
        }
    }

    function resetStopwatch() {
        clearInterval(stopwatchInterval);
        isRunning = false;
        isPaused = false;
        elapsedTime = 0;

        stopwatchDisplay.innerHTML = '00:00<span class="milliseconds">.000</span>';
        stopwatchDisplay.classList.remove('paused');

        startButton.style.display = 'inline-block';
        stopButton.style.display = 'none';
        stopButton.textContent = 'Pause';
    }

    stopButton.style.display = 'none';

    startButton.addEventListener('click', startStopwatch);
    stopButton.addEventListener('click', stopStopwatch);
    endButton.addEventListener('click', resetStopwatch);
});
