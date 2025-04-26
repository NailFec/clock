document.addEventListener('DOMContentLoaded', () => {
    const timeButton = document.getElementById('time-button');
    const countdownButton = document.getElementById('countdown-button');
    const stopwatchButton = document.getElementById('stopwatch-button');
    const embeddedView = document.getElementById('embedded-view');

    const taskInputContainer = document.getElementById('task-input-container');
    const taskName = document.getElementById('task-name');
    const taskType = document.getElementById('task-type');
    const startButton = document.getElementById('start-button');
    const timerContainer = document.getElementById('timer-container');
    const timerDisplay = document.getElementById('timer-display');
    const currentTaskName = document.getElementById('current-task-name');
    const currentTaskType = document.getElementById('current-task-type');
    const endButton = document.getElementById('end-button');

    const timeline = document.getElementById('timeline');
    const clearButton = document.getElementById('clear-button');
    const exportButton = document.getElementById('export-button');

    let tasks = JSON.parse(localStorage.getItem('scheduleTasks')) || [];
    let currentTask = null;
    let startTime = 0;
    let elapsedTime = 0;
    let timerInterval;
    let isRunning = false;
    let currentView = null; // 'time' or 'countdown' or 'stopwatch'

    initializePage();

    timeButton.addEventListener('click', () => showView('time'));
    countdownButton.addEventListener('click', () => showView('countdown'));
    stopwatchButton.addEventListener('click', () => showView('stopwatch'));
    startButton.addEventListener('click', startTask);
    endButton.addEventListener('click', endTask);
    clearButton.addEventListener('click', clearSchedule);
    exportButton.addEventListener('click', exportSchedule);

    function initializePage() {
        renderTimeline();
        showView('time');
    }

    function showView(view) {
        currentView = view;

        if (view === 'time') {
            loadTimeView();
        } else if (view === 'countdown') {
            loadCountdownView();
        } else if (view === 'stopwatch') {
            loadStopwatchView();
        }
    }

    function loadTimeView() {
        const iframe = document.createElement('iframe');
        iframe.src = '../time/index.html';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';

        embeddedView.innerHTML = '';
        embeddedView.appendChild(iframe);
    }

    function loadCountdownView() {
        const iframe = document.createElement('iframe');
        iframe.src = '../countdown/index.html';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';

        embeddedView.innerHTML = '';
        embeddedView.appendChild(iframe);
    }

    function loadStopwatchView() {
        const iframe = document.createElement('iframe');
        iframe.src = '../stopwatch/index.html';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';

        embeddedView.innerHTML = '';
        embeddedView.appendChild(iframe);
    }

    function startTask() {
        const name = taskName.value.trim();
        if (!name) {
            alert('Please enter a task name');
            return;
        }

        const type = taskType.value;
        const start = new Date();

        currentTask = {
            id: Date.now(), name, type, start, end: null, duration: 0
        };

        taskInputContainer.classList.add('hidden');
        timerContainer.classList.remove('hidden');
        currentTaskName.textContent = name;
        currentTaskType.textContent = type.charAt(0).toUpperCase() + type.slice(1);

        startTime = Date.now();
        elapsedTime = 0;
        timerInterval = setInterval(updateTimer, 1000);
        isRunning = true;

        renderTimeline();
    }

    function endTask() {
        if (!currentTask) return;

        clearInterval(timerInterval);
        isRunning = false;

        currentTask.end = new Date();
        currentTask.duration = Math.floor((currentTask.end - currentTask.start) / 1000);
        tasks.push(currentTask);

        localStorage.setItem('scheduleTasks', JSON.stringify(tasks));

        timerContainer.classList.add('hidden');
        taskInputContainer.classList.remove('hidden');
        taskName.value = '';

        currentTask = null;

        renderTimeline();
    }

    function updateTimer() {
        const currentTime = Date.now();
        const timeToDisplay = elapsedTime + (currentTime - startTime);

        const totalSeconds = Math.floor(timeToDisplay / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        const formattedMinutes = minutes.toString().padStart(2, '0');
        const formattedSeconds = seconds.toString().padStart(2, '0');

        timerDisplay.textContent = `${formattedMinutes}:${formattedSeconds}`;
    }

    function renderTimeline() {
        timeline.innerHTML = '';

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        tasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.classList.add('timeline-task', task.type);

            const startTime = new Date(task.start);
            const endTime = new Date(task.end);

            const startPercent = (startTime.getHours() * 60 + startTime.getMinutes()) / (24 * 60);
            const endPercent = (endTime.getHours() * 60 + endTime.getMinutes()) / (24 * 60);

            const left = startPercent * 100;
            const width = (endPercent - startPercent) * 100;

            taskElement.style.left = `${left}%`;
            taskElement.style.width = `${width}%`;

            const displayName = task.name.length > 15 ? task.name.substring(0, 12) + '...' : task.name;
            taskElement.textContent = displayName;

            timeline.appendChild(taskElement);
        });

        if (currentTask) {
            const taskElement = document.createElement('div');
            taskElement.classList.add('timeline-task', currentTask.type, 'current');

            const startTime = new Date(currentTask.start);
            const now = new Date();

            const startPercent = (startTime.getHours() * 60 + startTime.getMinutes()) / (24 * 60);
            const currentPercent = (now.getHours() * 60 + now.getMinutes()) / (24 * 60);

            const left = startPercent * 100;
            const width = (currentPercent - startPercent) * 100;

            taskElement.style.left = `${left}%`;
            taskElement.style.width = `${width}%`;

            const displayName = currentTask.name.length > 15 ? currentTask.name.substring(0, 12) + '...' : currentTask.name;
            taskElement.textContent = displayName;

            timeline.appendChild(taskElement);
        }
    }

    function exportSchedule() {
        if (tasks.length === 0 && !currentTask) {
            alert('No tasks to export');
            return;
        }

        let exportData = 'Schedule Export\n\n';
        exportData += 'Date: ' + new Date().toLocaleDateString() + '\n\n';

        if (currentTask) {
            const startTime = new Date(currentTask.start).toLocaleTimeString();
            exportData += `CURRENT TASK:\n`;
            exportData += `Name: ${currentTask.name}\n`;
            exportData += `Type: ${currentTask.type}\n`;
            exportData += `Start Time: ${startTime}\n`;
            exportData += `Status: In Progress\n\n`;
        }

        if (tasks.length > 0) {
            exportData += 'COMPLETED TASKS:\n';
            tasks.forEach((task, index) => {
                const startTime = new Date(task.start).toLocaleTimeString();
                const endTime = new Date(task.end).toLocaleTimeString();
                const duration = formatDuration(task.duration);

                exportData += `${index + 1}. ${task.name}\n`;
                exportData += `   Type: ${task.type}\n`;
                exportData += `   Start: ${startTime}\n`;
                exportData += `   End: ${endTime}\n`;
                exportData += `   Duration: ${duration}\n\n`;
            });
        }

        const blob = new Blob([exportData], {type: 'text/plain'});
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'schedule_export_' + new Date().toISOString().split('T')[0] + '.txt';
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }

    function formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        let result = '';
        if (hours > 0) result += `${hours}h `;
        if (minutes > 0 || hours > 0) result += `${minutes}m `;
        result += `${remainingSeconds}s`;

        return result;
    }

    function clearSchedule() {
        if (confirm('Are you sure you want to clear all task records? This operation cannot be undone.')) {
            localStorage.removeItem('scheduleTasks');
            tasks = [];
            renderTimeline();
            alert('All data have been cleared.');
        }
    }

    setInterval(renderTimeline, 60000);
});
