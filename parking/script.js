function reloadAllData() {
  // 呼叫 Geolocation API 來獲取使用者的位置
  if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
          position => {
              const lon = position.coords.longitude;
              const lat = position.coords.latitude;
              fetchParkingData(lon, lat);
          },
          error => {
              console.warn('定位失敗，使用預設值:', error.message);
              fetchParkingData(121.5182628183706, 25.116413447570153); // 台北市的預設經緯度
          }
      );
  } else {
      console.warn('Geolocation API 不被支援，使用預設值');
      fetchParkingData(121.5182628183706, 25.116413447570153); // 台北市的預設經緯度
  }
};

function fetchParkingData(lon, lat) {
  // 設定 POST 請求的參數
  const postData = {
      catagory: 'car',
      type: 1,
      lon: 121.5182628183706, //lon,
      lat: 25.116413447570153,//lat
  };




  fetch('https://www.rich-hsu.com/itaipeiparking.pma.gov.taipei__MapAPI__GetAllPOIData.php', { // 發送請求到代理程式
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify(postData)
  })
  .then(response => response.json())
  .then(data => {
      displayParkingData(data);
  })
  .catch(error => {
      console.error('Error:', error);
  });
}

function displayParkingData(parkingData) {

  const parkingList = document.getElementById('parkingList');
  parkingList.innerHTML = ''; // 清空列表

  if (parkingData.length === 0) {
      parkingList.innerHTML = '<li>無法找到附近的停車場</li>';
      return;
  }

  parkingData = parkingData.filter ( (parking) => { return null != parking.carRemainderNum && null != parking.address; }).filter( (parking) => { return parking.parkName.match(/(榮民|嘟嘟)/); });
  //parkingData = parkingData.filter((parking) => { return parking.parkId == 375 ; });

  parkingData.forEach(parking => {
      console.log(parking);
      const li = document.createElement('li');
      li.innerHTML = `
          <a href="google.navigation:q=${parking.parkName}}," target=_blank><strong>${parking.parkName}</strong><br>
          地址: ${parking.address}<br>
          空位: <span class="emphasize">${parking.carRemainderNum}</span>${parking.carRemainderNum ? ` (總共 ${parking.carTotalNum} 個車位)` : ' - 滿位'}
          </a>
      `;


      parkingList.appendChild(li);
  });

  setTimeout( () => { reloadAllData(); }, 30 * 1000);
}

reloadAllData();
