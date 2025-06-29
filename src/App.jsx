// import { useState } from 'react'
import './App.css'

function App() {
  // const [count, setCount] = useState(0)

  return (
    <>
      <div className='container' style={{ height: '100vh', width: '100vh' }}>
        
        <div id="main">
          <div id="map"></div>
        </div>

        <script async defer
          src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDH5CokCMZs5Fh_e0VCY38NoKPflfUD7ds&callback=initMap">
        </script>

        <script>
          function initMap(){
            const home = {lat: 37.954604, lng: 23.710506};
            const x = home.lat; const y = home.lng;
            const map = new google.maps.Map(
            document.getElementById('map'), {zoom: 17, center: home});
            const homeMarker = new google.maps.Marker({position: home, map: map});

            //Ενδιαφέρουσες στάσεις
            const stopCodes=[
                        240115, //1η Χαροκόπου
                        340083, //Εφέσου (Αθήνα)
                        240003, // Εφέσου
                        240054, //1η Χαροκόπου (Πειραιάς)
                        240034, //Δοϊράνης
                        240048, //Αγ. Πάντων (Συγγρού-Φιξ)
                        240028] //Αγ. Πάντων (Τζιτζιφιές)

            for(let i=0;i<stopCodes.length;i++){
              use('getStopNameAndXY', stopCodes[i]).then(drawStop, failure);
            }


            const p1=340083;

            window.map=map;
            window.markers=[];
          }
    </script>

      </div>
    </>
  )
}

export default App
