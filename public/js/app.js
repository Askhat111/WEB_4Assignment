let lineChart = null;
let barChart = null;

document.getElementById('analyticsForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const field = document.getElementById('field').value;     
  const start_date = document.getElementById('start_date').value;
  const end_date = document.getElementById('end_date').value;

  const params = new URLSearchParams({ field });
  if (start_date) params.append('start_date', start_date);
  if (end_date) params.append('end_date', end_date);

  try {
    const res = await fetch(`/api/measurements?${params}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      alert('No data found for selected dates');
      return;
    }

    console.log('Got', data.length, 'daily averages');

    const labels = data.map(item => {
      const date = new Date(item.timestamp);
      return date.getDate(); 
    });

    const values = data.map(item => item[field] || 0);

    createDailyLineChart(labels, values, field, start_date, end_date);
    createDailyBarChart(labels, values, field, start_date, end_date);
    
  } catch (err) {
    console.error('Error:', err);
    alert('Error loading data');
  }
});

function createDailyLineChart(labels, values, field, startDate, endDate) {
  const canvas = document.getElementById('lineChart');
  if (lineChart) lineChart.destroy();

  lineChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: labels.map(label => `Day ${label}`),
      datasets: [{
        label: `Daily Average ${getFieldLabel(field)}`,
        data: values,
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 2,
        fill: true,
        tension: 0.2,
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => `Avg: ${context.parsed.y.toFixed(2)}`,
            title: (context) => `Day ${labels[context[0].dataIndex]}`
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Day of Month'
          }
        },
        y: {
          title: {
            display: true,
            text: getFieldLabel(field)
          },
          beginAtZero: false
        }
      }
    }
  });
}

function createDailyBarChart(labels, values, field, startDate, endDate) {
  const canvas = document.getElementById('barChart');
  if (barChart) barChart.destroy();

  const maxDays = Math.min(31, labels.length);
  const barLabels = labels.slice(0, maxDays);
  const barValues = values.slice(0, maxDays);

  barChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: barLabels.map(label => `Day ${label}`),
      datasets: [{
        label: `Daily Average ${getFieldLabel(field)}`,
        data: barValues,
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgb(255, 99, 132)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => `Avg: ${context.parsed.y.toFixed(2)}`,
            title: (context) => `Day ${barLabels[context[0].dataIndex]}`
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Day of Month'
          }
        },
        y: {
          title: {
            display: true,
            text: getFieldLabel(field)
          },
          beginAtZero: false
        }
      }
    }
  });
}

async function getMetrics() {
  const field = document.getElementById('field').value;
  const start_date = document.getElementById('start_date').value;
  const end_date = document.getElementById('end_date').value;

  if (!field) {
    alert('Please select a field first');
    return;
  }

  const params = new URLSearchParams({ field });
  if (start_date) params.append('start_date', start_date);
  if (end_date) params.append('end_date', end_date);

  try {
    const res = await fetch(`/api/measurements/metrics?${params}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const metrics = await res.json();
    
    displayMetrics(metrics);
  } catch (err) {
    console.error('Metrics error:', err);
    alert('Error calculating metrics');
  }
}

function displayMetrics(metrics) {
  const metricsDiv = document.getElementById('metrics');
  
  metricsDiv.innerHTML = `
    <div class="metric-card">
      <div class="metric-label">Average</div>
      <div class="metric-value">${metrics.avg ? metrics.avg.toFixed(2) : '0.00'}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Minimum</div>
      <div class="metric-value">${metrics.min ? metrics.min.toFixed(2) : '0.00'}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Maximum</div>
      <div class="metric-value">${metrics.max ? metrics.max.toFixed(2) : '0.00'}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Standard Deviation</div>
      <div class="metric-value">${metrics.stdDev ? metrics.stdDev.toFixed(2) : '0.00'}</div>
    </div>
  `;
  
  document.getElementById('metricsSection').style.display = 'block';
}

function getFieldLabel(field) {
  const map = {
    field1: 'Temperature (°C)',
    field2: 'Humidity (%)',
    field3: 'Apparent Temp (°C)',
  };
  return map[field] || field;
}