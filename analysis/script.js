document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-input');
    const timelineContainer = document.getElementById('timeline-container');
    const studyTasksDetails = document.getElementById('study-tasks-details');
    const restTasksDetails = document.getElementById('rest-tasks-details');

    // Chart instances
    let studyRestChart = null;
    let studyTasksChart = null;
    let restTasksChart = null;
    let dailyStatsChart = null;

    // All tasks from imported files
    let allTasks = [];

    // Initialize event listeners
    fileInput.addEventListener('change', handleFileImport);

    // Handle file import
    async function handleFileImport(event) {
        const files = event.target.files;
        if (files.length === 0) return;

        allTasks = [];

        try {
            for (const file of files) {
                const content = await readFile(file);
                const data = jsyaml.load(content);

                if (data && data.tasks && Array.isArray(data.tasks)) {
                    allTasks = [...allTasks, ...data.tasks];
                }
            }

            // Sort tasks by date and start time
            allTasks.sort((a, b) => {
                const dateA = new Date(a.date + 'T' + a.start);
                const dateB = new Date(b.date + 'T' + b.start);
                return dateA - dateB;
            });

            // Process and display data
            renderTimeline();
            renderCharts();
            renderTaskDetails();

        } catch (error) {
            console.error('Error processing YAML files:', error);
            alert('Error processing YAML files. Please check the console for details.');
        }
    }

    // Read file content as text
    function readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);

            reader.readAsText(file);
        });
    }

    // Render timeline by date
    function renderTimeline() {
        timelineContainer.innerHTML = '';

        if (allTasks.length === 0) {
            timelineContainer.innerHTML = '<div class="no-data">No data to display. Please import YAML files.</div>';
            return;
        }

        // Group tasks by date
        const tasksByDate = {};
        allTasks.forEach(task => {
            if (!tasksByDate[task.date]) {
                tasksByDate[task.date] = [];
            }
            tasksByDate[task.date].push(task);
        });

        // Create timeline for each date
        Object.keys(tasksByDate).sort().forEach(date => {
            const dayTasks = tasksByDate[date];

            // Create day timeline container
            const dayTimeline = document.createElement('div');
            dayTimeline.className = 'day-timeline';

            // Format date for display
            const displayDate = formatDate(date);

            // Create day header
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            dayHeader.textContent = displayDate;
            dayTimeline.appendChild(dayHeader);

            // Create timeline hours
            const timelineHours = document.createElement('div');
            timelineHours.className = 'timeline-hours';
            for (let i = 0; i <= 24; i += 6) {
                const hourMarker = document.createElement('div');
                hourMarker.className = 'hour-marker';
                hourMarker.textContent = i;
                timelineHours.appendChild(hourMarker);
            }
            dayTimeline.appendChild(timelineHours);

            // Create timeline
            const timeline = document.createElement('div');
            timeline.className = 'timeline';

            // Add tasks to timeline
            dayTasks.forEach(task => {
                if (task.start) {
                    const taskBlock = document.createElement('div');
                    taskBlock.className = `task-block ${task.type}`;

                    // Calculate position and width
                    const startTime = parseTimeString(task.start);
                    let endTime;

                    if (task.status === "进行中") {
                        // For tasks in progress, use current time or end of day
                        endTime = new Date();
                        if (date !== new Date().toISOString().split('T')[0]) {
                            // If not today, use end of day
                            endTime = new Date(date + 'T23:59:59');
                        }
                    } else {
                        endTime = parseTimeString(task.end);
                    }

                    const startPercent = (startTime.getHours() * 60 + startTime.getMinutes()) / (24 * 60);
                    const endPercent = (endTime.getHours() * 60 + endTime.getMinutes()) / (24 * 60);

                    const left = startPercent * 100;
                    const width = (endPercent - startPercent) * 100;

                    taskBlock.style.left = `${left}%`;
                    taskBlock.style.width = `${width}%`;

                    // Add task name
                    const displayName = task.name.length > 15 ? task.name.substring(0, 12) + '...' : task.name;
                    taskBlock.textContent = displayName;

                    // Add tooltip with full information
                    taskBlock.title = `${task.name} (${task.type})\nStart: ${task.start}\n${task.end ? 'End: ' + task.end : 'Status: ' + task.status}\n${task.duration ? 'Duration: ' + task.duration : ''}`;

                    timeline.appendChild(taskBlock);
                }
            });

            dayTimeline.appendChild(timeline);
            timelineContainer.appendChild(dayTimeline);
        });
    }

    // Render charts
    function renderCharts() {
        if (allTasks.length === 0) return;

        renderDailyStatsChart();
        renderStudyRestChart();
        renderStudyTasksChart();
        renderRestTasksChart();
    }

    // Render daily statistics bar chart
    function renderDailyStatsChart() {
        // Group tasks by date
        const tasksByDate = {};
        allTasks.forEach(task => {
            if (task.duration) {
                if (!tasksByDate[task.date]) {
                    tasksByDate[task.date] = {
                        study: 0,
                        rest: 0
                    };
                }

                const seconds = parseDuration(task.duration);
                if (task.type === 'study') {
                    tasksByDate[task.date].study += seconds;
                } else if (task.type === 'relax') {
                    tasksByDate[task.date].rest += seconds;
                }
            }
        });

        // Convert to arrays for Chart.js
        const dates = Object.keys(tasksByDate).sort();
        const studyData = [];
        const restData = [];

        dates.forEach(date => {
            studyData.push(tasksByDate[date].study / 3600); // Convert to hours
            restData.push(tasksByDate[date].rest / 3600); // Convert to hours
        });

        // Format dates for display
        const formattedDates = dates.map(date => formatDate(date));

        const ctx = document.getElementById('daily-stats-chart').getContext('2d');

        if (dailyStatsChart) {
            dailyStatsChart.destroy();
        }

        dailyStatsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: formattedDates,
                datasets: [
                    {
                        label: 'Study Time (hours)',
                        data: studyData,
                        backgroundColor: '#0066cc',
                        borderColor: '#004999',
                        borderWidth: 1
                    },
                    {
                        label: 'Rest Time (hours)',
                        data: restData,
                        backgroundColor: '#cc3300',
                        borderColor: '#992600',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        ticks: {
                            color: '#fff'
                        },
                        grid: {
                            color: '#333'
                        }
                    },
                    y: {
                        ticks: {
                            color: '#fff'
                        },
                        grid: {
                            color: '#333'
                        },
                        title: {
                            display: true,
                            text: 'Hours',
                            color: '#fff'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#fff'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const value = context.raw;
                                const hours = Math.floor(value);
                                const minutes = Math.round((value - hours) * 60);
                                return `${context.dataset.label}: ${hours}h ${minutes}m`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Render study vs rest pie chart
    function renderStudyRestChart() {
        const studyTasks = allTasks.filter(task => task.type === 'study' && task.duration);
        const restTasks = allTasks.filter(task => task.type === 'relax' && task.duration);

        let studyTime = 0;
        let restTime = 0;

        studyTasks.forEach(task => {
            studyTime += parseDuration(task.duration);
        });

        restTasks.forEach(task => {
            restTime += parseDuration(task.duration);
        });

        const ctx = document.getElementById('study-rest-chart').getContext('2d');

        if (studyRestChart) {
            studyRestChart.destroy();
        }

        studyRestChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Study', 'Rest'],
                datasets: [{
                    data: [studyTime, restTime],
                    backgroundColor: ['#0066cc', '#cc3300'],
                    borderColor: ['#004999', '#992600'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#fff'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${context.label}: ${formatSeconds(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Render study tasks pie chart
    function renderStudyTasksChart() {
        const studyTasks = allTasks.filter(task => task.type === 'study' && task.duration);

        // Group by task name
        const taskGroups = {};
        studyTasks.forEach(task => {
            if (!taskGroups[task.name]) {
                taskGroups[task.name] = 0;
            }
            taskGroups[task.name] += parseDuration(task.duration);
        });

        const labels = Object.keys(taskGroups);
        const data = Object.values(taskGroups);

        // Generate colors
        const colors = generateColors(labels.length, '#0066cc', '#004080');

        const ctx = document.getElementById('study-tasks-chart').getContext('2d');

        if (studyTasksChart) {
            studyTasksChart.destroy();
        }

        studyTasksChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#fff'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${context.label}: ${formatSeconds(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Render rest tasks pie chart
    function renderRestTasksChart() {
        const restTasks = allTasks.filter(task => task.type === 'relax' && task.duration);

        // Group by task name
        const taskGroups = {};
        restTasks.forEach(task => {
            if (!taskGroups[task.name]) {
                taskGroups[task.name] = 0;
            }
            taskGroups[task.name] += parseDuration(task.duration);
        });

        const labels = Object.keys(taskGroups);
        const data = Object.values(taskGroups);

        // Generate colors
        const colors = generateColors(labels.length, '#cc3300', '#801f00');

        const ctx = document.getElementById('rest-tasks-chart').getContext('2d');

        if (restTasksChart) {
            restTasksChart.destroy();
        }

        restTasksChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#fff'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${context.label}: ${formatSeconds(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Render task details
    function renderTaskDetails() {
        studyTasksDetails.innerHTML = '';
        restTasksDetails.innerHTML = '';

        if (allTasks.length === 0) {
            studyTasksDetails.innerHTML = '<div class="no-data">No study tasks to display.</div>';
            restTasksDetails.innerHTML = '<div class="no-data">No rest tasks to display.</div>';
            return;
        }

        const studyTasks = allTasks.filter(task => task.type === 'study');
        const restTasks = allTasks.filter(task => task.type === 'relax');

        // Group study tasks by name
        const studyTasksByName = {};
        studyTasks.forEach(task => {
            if (!studyTasksByName[task.name]) {
                studyTasksByName[task.name] = [];
            }
            studyTasksByName[task.name].push(task);
        });

        // Group rest tasks by name
        const restTasksByName = {};
        restTasks.forEach(task => {
            if (!restTasksByName[task.name]) {
                restTasksByName[task.name] = [];
            }
            restTasksByName[task.name].push(task);
        });

        // Render study tasks
        if (Object.keys(studyTasksByName).length === 0) {
            studyTasksDetails.innerHTML = '<div class="no-data">No study tasks to display.</div>';
        } else {
            Object.keys(studyTasksByName).forEach(taskName => {
                const tasks = studyTasksByName[taskName];

                // Create category header
                const categoryHeader = document.createElement('div');
                categoryHeader.className = 'task-category';
                categoryHeader.textContent = taskName;
                studyTasksDetails.appendChild(categoryHeader);

                // Create task items
                tasks.forEach(task => {
                    const taskItem = document.createElement('div');
                    taskItem.className = 'task-item';

                    const taskInfo = document.createElement('div');
                    taskInfo.className = 'task-info';

                    // Add date
                    const dateSpan = document.createElement('span');
                    dateSpan.textContent = `Date: ${formatDate(task.date)}`;
                    taskInfo.appendChild(dateSpan);

                    // Add time
                    const timeSpan = document.createElement('span');
                    timeSpan.textContent = `Time: ${task.start} - ${task.end || 'In Progress'}`;
                    taskInfo.appendChild(timeSpan);

                    // Add duration if available
                    if (task.duration) {
                        const durationSpan = document.createElement('span');
                        durationSpan.textContent = `Duration: ${task.duration}`;
                        taskInfo.appendChild(durationSpan);
                    }

                    taskItem.appendChild(taskInfo);
                    studyTasksDetails.appendChild(taskItem);
                });
            });
        }

        // Render rest tasks
        if (Object.keys(restTasksByName).length === 0) {
            restTasksDetails.innerHTML = '<div class="no-data">No rest tasks to display.</div>';
        } else {
            Object.keys(restTasksByName).forEach(taskName => {
                const tasks = restTasksByName[taskName];

                // Create category header
                const categoryHeader = document.createElement('div');
                categoryHeader.className = 'task-category';
                categoryHeader.textContent = taskName;
                restTasksDetails.appendChild(categoryHeader);

                // Create task items
                tasks.forEach(task => {
                    const taskItem = document.createElement('div');
                    taskItem.className = 'task-item';

                    const taskInfo = document.createElement('div');
                    taskInfo.className = 'task-info';

                    // Add date
                    const dateSpan = document.createElement('span');
                    dateSpan.textContent = `Date: ${formatDate(task.date)}`;
                    taskInfo.appendChild(dateSpan);

                    // Add time
                    const timeSpan = document.createElement('span');
                    timeSpan.textContent = `Time: ${task.start} - ${task.end || 'In Progress'}`;
                    taskInfo.appendChild(timeSpan);

                    // Add duration if available
                    if (task.duration) {
                        const durationSpan = document.createElement('span');
                        durationSpan.textContent = `Duration: ${task.duration}`;
                        taskInfo.appendChild(durationSpan);
                    }

                    taskItem.appendChild(taskInfo);
                    restTasksDetails.appendChild(taskItem);
                });
            });
        }
    }

    // Helper function to format date
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }

    // Helper function to parse time string
    function parseTimeString(timeString) {
        const [hours, minutes, seconds] = timeString.split(':').map(Number);
        const date = new Date();
        date.setHours(hours || 0);
        date.setMinutes(minutes || 0);
        date.setSeconds(seconds || 0);
        return date;
    }

    // Helper function to parse duration string
    function parseDuration(durationString) {
        let seconds = 0;

        if (durationString.includes('h')) {
            const hours = parseInt(durationString.match(/(\d+)h/)?.[1] || '0');
            seconds += hours * 3600;
        }

        if (durationString.includes('m')) {
            const minutes = parseInt(durationString.match(/(\d+)m/)?.[1] || '0');
            seconds += minutes * 60;
        }

        if (durationString.includes('s')) {
            const secs = parseInt(durationString.match(/(\d+)s/)?.[1] || '0');
            seconds += secs;
        }

        return seconds;
    }

    // Helper function to format seconds to human-readable duration
    function formatSeconds(totalSeconds) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        let result = '';
        if (hours > 0) result += `${hours}h `;
        if (minutes > 0 || hours > 0) result += `${minutes}m `;
        result += `${seconds}s`;

        return result;
    }

    // Helper function to generate colors for pie chart
    function generateColors(count, baseColor, endColor) {
        const backgroundColors = [];
        const borderColors = [];

        // Parse base color
        const baseR = parseInt(baseColor.substring(1, 3), 16);
        const baseG = parseInt(baseColor.substring(3, 5), 16);
        const baseB = parseInt(baseColor.substring(5, 7), 16);

        // Parse end color
        const endR = parseInt(endColor.substring(1, 3), 16);
        const endG = parseInt(endColor.substring(3, 5), 16);
        const endB = parseInt(endColor.substring(5, 7), 16);

        for (let i = 0; i < count; i++) {
            const ratio = count > 1 ? i / (count - 1) : 0.5;

            // Interpolate between base and end color
            const r = Math.round(baseR + (endR - baseR) * ratio);
            const g = Math.round(baseG + (endG - baseG) * ratio);
            const b = Math.round(baseB + (endB - baseB) * ratio);

            // Convert to hex
            const bgColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

            // Darker border color
            const borderR = Math.max(0, r - 40);
            const borderG = Math.max(0, g - 40);
            const borderB = Math.max(0, b - 40);
            const borderColor = `#${borderR.toString(16).padStart(2, '0')}${borderG.toString(16).padStart(2, '0')}${borderB.toString(16).padStart(2, '0')}`;

            backgroundColors.push(bgColor);
            borderColors.push(borderColor);
        }

        return {
            background: backgroundColors,
            border: borderColors
        };
    }
});
