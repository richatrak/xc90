// script.js

const apiKey = '5cecab3d855d54a068b054503c70e669';
const cacheKey = 'weatherDataCache';
let hourlyChart;

// 定義獲取天氣資訊的函數
function fetchWeatherData(lat, lon) {
    const currentWeatherURL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=${navigator.language.replace('-','_')}&appid=${apiKey}`;
    const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=${navigator.language.replace('-','_')}&appid=${apiKey}`;
    const cityURL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&appid=${apiKey}`;

    fetch (cityURL)
        .then(response => response.json())
        .then(data => {
            const city = navigator.languages.reduce( ( city , lang) => {
                if (! city ) {
                    return data[0].local_names[lang] ?? data[0].local_names[lang.replace('-','_')];
                }
                return city;
            }, null) ?? data[0].name ;

            document.getElementById('current-city').textContent = city
        });

    // 獲取當前天氣
    fetch(currentWeatherURL)
        .then(response => response.json())
        .then(data => {
            updateCurrentWeather(data);
            cacheWeatherData('currentWeather', data); // 快取當前天氣資料

            const date = new Date(data.dt * 1000);
            document.getElementById('update-time').innerHTML = `更新時間:<br>${date.getFullYear()}-${new String(date.getMonth() + 1).padStart(2,'0')}-${new String(date.getDate()).padStart(2,'0')} ${new String(date.getHours()).padStart(2,'0')}:${new String(date.getMinutes()).padStart(2,'0')}:${new String(date.getSeconds()).padStart(2,'0')}`;
        });

    // 獲取未來每3小時預報
    fetch(forecastURL)
        .then(response => response.json())
        .then(data => {
            updateHourlyForecastChart(data);
            updateWeeklyForecast(data);
            cacheWeatherData('forecast', data); // 快取預報資料
        });
}

// 更新目前天氣的函數
function updateCurrentWeather(data) {
    document.getElementById('current-icon').src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    document.getElementById('current-temp').textContent = Math.round(data.main.temp);
    document.getElementById('current-description').textContent = data.weather[0].description;
    document.getElementById('current-detail').innerHTML = `
        高溫: ${Math.round(data.main.temp_max)}°C，低溫: ${Math.round(data.main.temp_min)}°C，體感溫度: ${Math.round(data.main.feels_like)}°C<br>
        濕度: ${data.main.humidity}%，風速: ${data.wind.speed} m/s，氣壓: ${data.main.pressure} hPa，能見度: ${data.visibility / 1000} km<br>
        日出: ${new String(new Date(data.sys.sunrise * 1000).getHours()).padStart(2,'0')}:${new String(new Date(data.sys.sunrise * 1000).getMinutes()).padStart(2,'0')}，日落: ${new String(new Date(data.sys.sunset * 1000).getHours()).padStart(2,'0')}:${new String(new Date(data.sys.sunset * 1000).getMinutes()).padStart(2,'0')}
    `;
}

// 使用 Chart.js 更新每小時預報的混合圖表（折線圖+長條圖）
function updateHourlyForecastChart(data) {
    const labels = [];
    const temps = [];
    const pops = [];

    const hoursToShow = 12;
    const filteredData = data.list.slice(0, hoursToShow); // 取前12個時間點（每3小時一個點）

    filteredData.forEach(hourData => {
        const hour = new Date(hourData.dt * 1000).getHours();
        labels.push(`${hour}:00`);
        temps.push(Math.round(hourData.main.temp));
        pops.push(Math.round(hourData.pop * 100));
    });

    const tempsMax = Math.max(...temps) + 2 ;
    const tempsMin = Math.min(...temps) - 2 ;


    const ctx = document.getElementById('hourlyChart').getContext('2d');
    if (hourlyChart) {
        hourlyChart.destroy(); // 清除之前的圖表，避免重疊
    }

    hourlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '溫度 (°C)',
                    data: temps,
                    type: 'line', // 折線圖
                    borderColor: '#f39c12', // 橙色折線
                    backgroundColor: 'rgba(243, 156, 18, 0.2)', // 淡橙色背景
                    yAxisID: 'y_temp',
                    tension: 0.4, // 平滑折線
                    fill: true, // 填充下方區域
                    datalabels: {
                        align: 'top',
                        anchor: 'end',
                        color: '#f39c12', // 白色文字
                        backgroundColor: '#333', // 藍色背景
                        borderRadius: 4, // 圓角
                        formatter: (value) => `${value}°C`
                    }
                },
                {
                    label: '降雨機率 (%)',
                    data: pops,
                    type: 'bar', // 長條圖
                    backgroundColor: '#3498db', // 藍色長條
                    yAxisID: 'y_pop',
                    datalabels: {
                        align: 'bottom', // 與長條頂端對齊
                        anchor: 'start', // 將文字顯示在條形圖頂部
                        offset: -20, // 向上偏移文字位置
                        color: '#ffffff', // 白色文字
                        formatter: (value) => `${value}%`
                    },
                }
            ]
        },
        options: {
            scales: {
                x: {
                    grid: {
                        color: '#34495e', // 網格線顏色
                    },
                    ticks: {
                        color: '#ffffff', // X軸字體顏色
                    }
                },
                y_temp: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    max: tempsMax,
                    min: tempsMin,
                    display: false,
                },
                y_pop: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    max: 100,
                    min:0,
                    display: false,
                }
            },

            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff' // 圖例字體顏色
                    }
                },
                datalabels: {
                    display: true, // 顯示數據標籤
                }
            }
        },
        plugins: [ChartDataLabels] // 啟用 Chart.js Data Labels 插件
    });
}

// 更新一周預報的函數
function updateWeeklyForecast(data) {
    const forecastContainer = document.getElementById('forecast-container');
    forecastContainer.innerHTML = ''; // 清空一周預報區域

    // 取每一天中間的預報來表示一整天的預報
    const dailyData = data.list.filter(item => item.dt_txt.includes("12:00:00"));

    dailyData.forEach(dayData => {
        const dayElement = document.createElement('div');
        dayElement.classList.add('forecast-day');

        const date = new Date(dayData.dt * 1000);
        const day = date.toLocaleDateString('zh-TW', { weekday: 'short', month: 'numeric', day: 'numeric' });

        const dateStr = dayData.dt_txt.split(' ')[0];
        const maxTemp = Math.round(data.list.filter(item => item.dt_txt.includes(dateStr)).reduce((max, item) => item.main.temp_max > max ? item.main.temp_max : max, -100));
        const minTemp = Math.round(data.list.filter(item => item.dt_txt.includes(dateStr)).reduce((min, item) => item.main.temp_min < min ? item.main.temp_min : min, 100));

        dayElement.innerHTML = `
            <div class="day">${day}</div>
            <img src="https://openweathermap.org/img/wn/${dayData.weather[0].icon}@2x.png" alt="天氣圖示">
            <div class="day-temp">${Math.round(minTemp)} - ${Math.round(maxTemp)}°C</div>
            <div class="day-desc">${dayData.weather[0].description}</div>
        `;
        forecastContainer.appendChild(dayElement);
    });
}

// 快取資料到 localStorage
function cacheWeatherData(type, data) {
    const cache = {
        timestamp: Date.now(),
        data: data
    };
    localStorage.setItem(`${cacheKey}_${type}`, JSON.stringify(cache));
}

// 從 localStorage 中載入快取的資料
function loadCachedWeatherData(type) {
    const cache = localStorage.getItem(`${cacheKey}_${type}`);
    if (cache) {
        const parsedCache = JSON.parse(cache);
        // 檢查快取是否過期（例如設定過期時間為1小時）
        if (Date.now() - parsedCache.timestamp < 3600000) {
            return parsedCache.data;
        }
    }
    return null;
}


function reloadAllData() {
    // 使用 Geolocation API 獲取使用者位置
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                // 嘗試載入快取的資料
                const cachedCurrentWeather = loadCachedWeatherData('currentWeather');
                const cachedForecast = loadCachedWeatherData('forecast');

                if (cachedCurrentWeather) {
                    updateCurrentWeather(cachedCurrentWeather);
                }
                if (cachedForecast) {
                    updateHourlyForecastChart(cachedForecast);
                    updateWeeklyForecast(cachedForecast);
                }

                // 獲取並更新最新資料
                fetchWeatherData(lat, lon);
            },
            error => {
                console.error('無法獲取地理位置', error);
                // 使用快取資料或預設位置
                const cachedCurrentWeather = loadCachedWeatherData('currentWeather');
                const cachedForecast = loadCachedWeatherData('forecast');

                if (cachedCurrentWeather) {
                    updateCurrentWeather(cachedCurrentWeather);
                } else {
                    fetchWeatherData(25.0330, 121.5654); // 預設台北市位置
                }

                if (cachedForecast) {
                    updateHourlyForecastChart(cachedForecast);
                    updateWeeklyForecast(cachedForecast);
                }
            }
        );
    } else {
        console.error('Geolocation 不支援於這個瀏覽器');
        // 使用快取資料或預設位置
        const cachedCurrentWeather = loadCachedWeatherData('currentWeather');
        const cachedForecast = loadCachedWeatherData('forecast');

        if (cachedCurrentWeather) {
            updateCurrentWeather(cachedCurrentWeather);
        } else {
            fetchWeatherData(25.0330, 121.5654); // 預設台北市位置
        }

        if (cachedForecast) {
            updateHourlyForecastChart(cachedForecast);
            updateWeeklyForecast(cachedForecast);
        }
    }
}

reloadAllData(); // 載入所有資料

/*
setInterval(() => {
    if ( document.visibility !== 'visible' ) {
        return;
    }
    reloadAllData(); // 每20分鐘重新載入資料
}, 20 * 60 * 1000);
*/
