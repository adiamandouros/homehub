<html lang="en-US">
  <head>
    <meta charset="utf-8">
    <title>Sonovabitc</title>
    <meta name="author" content="adiamandouros@gmail">
    <link rel="stylesheet" href="resources/sonovabitc.css">

<!--     <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script> -->

    <link rel="apple-touch-icon" sizes="180x180" href="/resources/images/icons/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/resources/images/icons/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/resources/images/icons/favicon-16x16.png">
    <link rel="manifest" href="/resources/images/icons/site.webmanifest">
    <link rel="mask-icon" href="/resources/images/icons/safari-pinned-tab.svg" color="#5bbad5">
    <link rel="shortcut icon" href="/resources/images/icons/favicon.ico">
    <meta name="msapplication-TileColor" content="#00aba9">
    <meta name="msapplication-config" content="/resources/images/icons/browserconfig.xml">
    <meta name="theme-color" content="#ffffff">
    <meta name="google-signin-client_id" content="60395585293-b7qlesrp91if93fruebd4olklqs8i8h3.apps.googleusercontent.com.apps.googleusercontent.com">
  </head>
  <body>
    <div id="header">
      <span>Welcome</span>
      <button id="loginButton" onclick="document.getElementById('loginForm').style.display='block'">login</button>
    </div>
    <div id="loginForm" class="modal">
      <div class="g-signin2" data-onsuccess="onSignIn"></div>
      Or alternatively:
      <form action='home/home.php' method="post">
        <label for="uname">Username</label>
        <input type="text" placeholder="Enter Username" name="uname" required>
        <label for="psw">Password</label>
        <input type="password" placeholder="Enter Password" name="psw" required>
        <div id="loginControls">
          <button type="submit">enter</button>
          <button type="reset" onclick="document.getElementById('loginForm').style.display='none'">cancel</button>
        </div>
      </form>
    </div>
    <div id="main">
      <div id="map"></div>
<!--       <img src="resources/tw-small.png" id="mainImage" onclick="document.getElementById('mainImage').style.filter='hue-rotate(300deg)'"> -->
    </div>
  </body>

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
//       const p1=12341234;
//       use('getStopArrivals', p1).then(drawStop, failure);
//       use('getStopNameAndXY', p1).then(drawStop, failure);

//       const p2=240003;
//       use('getStopArrivals', p2);

//       use('getClosestStops', [x,y]);

      window.map=map;
      window.markers=[];
    }

    function drawStop(data){
      let map=window.map;

      console.log(data);
      console.log(data[0].stop_lat);

      const coords={
        lat:Number(data[0].stop_lat),
        lng:Number(data[0].stop_lng)
      }

      let marker = new google.maps.Marker({
        position: coords,
        map: map,
        title: data[0].stop_id,
        icon: 'https://sonovabitc.win/resources/images/icons/bus-stop.png'
      });

      let infowindow = new google.maps.InfoWindow({
        content: data[0].stop_descr
      });

      marker.addListener('click', function() {
        infowindow.open(map, marker);
//         for(let i=0;i<markers.length;i++){
//           if(markers[i]!=)
//         }
      });

      markers.push(marker);
    }

    function success(data){
      console.log("success");
      console.log(data);
    }
    function failure(data){
      console.log("failure");
//       console.log(data);
    }

    function use(action, params){
      let ajaxPromise = new Promise(function(resolve, reject){

        let xhttp = new XMLHttpRequest();
        xhttp.open("GET", "help.php?act="+action+"&parameters="+params, true);
//         xhttp.open("GET", "http://telematics.oasa.gr/api/?act="+action+"&p1=params", true);
        xhttp.send();

        xhttp.onreadystatechange = function() {
          if (this.readyState == 4){
            if (this.status == 200){
              console.log("call completed successfully");
              if(this.responseText == "null") reject(action, params);
              try{
                console.log("Trying to parse "+this.responseText);
                resolve(JSON.parse(this.responseText));
//                 resolve(this.responseText);
              }catch(error) {
                console.log("call failed with exception");
                reject(action, params);
              }
            }
            else{
              console.log("call failed");
              reject(action, params);
            }
          }
        }
//         console.log("request sent succesfully");
      });
      return ajaxPromise;
    }
    </script>
    <script async defer
    src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDH5CokCMZs5Fh_e0VCY38NoKPflfUD7ds&callback=initMap">
    </script>



    //LOGIN
    <script type="text/javascript">
      function onSignIn(googleUser) {
        // let profile = googleUser.getBasicProfile();
        // console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
        // console.log('Name: ' + profile.getName());
        // console.log('Image URL: ' + profile.getImageUrl());
        // console.log('Email: ' + profile.getEmail()); // This is null if the 'email' scope is not present.
        var id_token = googleUser.getAuthResponse().id_token;
        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://sonovabitc.win/oauthsuccess.php');
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.onload = function() {
          console.log('Signed in as: ' + xhr.responseText);
        };
        xhr.send('idtoken=' + id_token);
      }
    </script>



    <script src="https://apis.google.com/js/platform.js" async defer></script>
</html>
