var Client;
(function (Client) {
    let Master;
    (function (Master) {
        let ppMatrix;
        let poster;
        Master.onLoad = () => {
            Client.sendRequest("/masterData", null, (status, headers) => {
                const data = JSON.parse(headers.get("data"));
                ppMatrix = data.ppMatrix;
                Master.loeb = data.loeb;
                poster = data.poster;
                meldinger.updateSidsteMeldinger(data.sidsteMeldinger);
                patruljePlot.onLoad();
                patruljePlot.createPatruljePlot();
                patruljer.loadPatruljer();
                post.loadPoster();
                post.colorPoster(data.postStatus);
            }, (status) => {
                if (confirm("Fejl ved hentning af data " + status + ". Vil du logge ud?"))
                    logOut();
            });
        };
        const logOut = (deleteUser) => {
            if (deleteUser)
                Client.deleteCookie("identifier");
            location.href = "/home";
        };
        let patruljePlot;
        (function (patruljePlot) {
            patruljePlot.patruljeCollection = [];
            let plotLayout;
            let visUdgåede = true;
            const colors = ["rgb(48, 131, 220)", "rgb(68, 154, 202)", "rgb(126, 195, 200)", "rgb(62, 182, 112)", "rgb(77, 209, 105)"];
            const udgåetColor = "rgb(219, 125, 37)";
            let plotRange;
            patruljePlot.onLoad = () => {
                const rangeSelectorMinTemp = document.getElementById("patruljePlotRangeMin");
                const rangeSelectorMaxTemp = document.getElementById("patruljePlotRangeMax");
                for (let i = 0; i < poster.length; i++) {
                    const option = document.createElement("option");
                    option.text = poster[i].navn;
                    option.value = (i + 1).toString();
                    const option2 = document.createElement("option");
                    option2.text = poster[i].navn;
                    option2.value = (i + 1).toString();
                    rangeSelectorMinTemp.add(option);
                    rangeSelectorMaxTemp.add(option2);
                }
                rangeSelectorMaxTemp.value = poster.length.toString();
                plotRange = [-0.2, poster.length * 3 + 0.2];
            };
            class Data {
                constructor(patruljeIndex) {
                    const meldinger = ["På vej mod ", "Tjekket ind på ", "Tjekket ud fra "];
                    this.x = [];
                    this.y = [];
                    this.text = [];
                    this.name = Master.loeb.patruljer[patruljeIndex];
                    for (let t = 0; t < ppMatrix[patruljeIndex].length; t++) {
                        const pTimeStamp = ppMatrix[patruljeIndex][t];
                        if (pTimeStamp != "") {
                            this.x.push(t);
                            this.y.push(-(patruljeIndex + 1));
                            this.text.push("Patrulje " + (patruljeIndex + 1).toString() + " - " + this.name + "<br>" + meldinger[t % 3] + poster[Math.floor(t / 3)].navn + "<br>" + pTimeStamp);
                        }
                    }
                    const color = Master.loeb.udgåedePatruljer[patruljeIndex] ? udgåetColor : colors[patruljeIndex % 5];
                    this.mode = "lines+markers";
                    this.type = "scatter";
                    this.hoverinfo = "text";
                    this.marker = {
                        size: 8,
                        color: color
                    };
                    this.line = {
                        dash: "dot",
                        width: 2,
                        color: color
                    };
                    this.font = {
                        size: 15
                    };
                }
            }
            patruljePlot.Data = Data;
            patruljePlot.createPatruljePlot = () => {
                patruljePlot.patruljeCollection = [];
                for (let patruljeIndex = 0; patruljeIndex < ppMatrix.length; patruljeIndex++) {
                    if (visUdgåede || !Master.loeb.udgåedePatruljer[patruljeIndex])
                        patruljePlot.patruljeCollection.push(new Data(patruljeIndex));
                }
                plotLayout = generateLayout();
                Plotly.newPlot('patruljeOversigtPlot', patruljePlot.patruljeCollection, plotLayout);
            };
            patruljePlot.updatePatruljeOversigt = (patruljer, ppArrays) => {
                for (let i = 0; i < ppArrays.length; i++) {
                    const patrulje = patruljer[i];
                    ppMatrix[patrulje] = ppArrays[i];
                    patruljePlot.patruljeCollection[patrulje] = new Data(patrulje);
                }
                Plotly.newPlot('patruljeOversigtPlot', patruljePlot.patruljeCollection, plotLayout);
            };
            patruljePlot.visUdgåedeChanged = () => {
                visUdgåede = document.getElementById("visUdgåede").checked;
                patruljePlot.createPatruljePlot();
            };
            patruljePlot.rangeSelectorChanged = () => {
                const min = Number.parseInt(document.getElementById("patruljePlotRangeMin").value);
                const max = Number.parseInt(document.getElementById("patruljePlotRangeMax").value);
                plotRange = [(min - 1) * 3 - 0.2, max * 3 + 0.2];
                plotLayout.xaxis.range = plotRange;
                Plotly.newPlot('patruljeOversigtPlot', patruljePlot.patruljeCollection, plotLayout);
            };
            const generateLayout = () => {
                return {
                    autosize: true,
                    margin: {
                        t: 5,
                        l: 45,
                        r: 10,
                        b: 20
                    },
                    paper_bgcolor: "rgba(0,0,0,0",
                    plot_bgcolor: "rgba(0,0,0,0)",
                    showlegend: false,
                    font: {
                        size: 13
                    },
                    xaxis: {
                        ticktext: getPostNames(),
                        tickvals: getXTickVals(),
                        showgrid: false,
                        range: plotRange,
                    },
                    yaxis: {
                        ticktext: getYTickText(),
                        tickvals: getYTickVals(),
                        range: [-(ppMatrix.length + 0.5), -0.5,],
                        showgrid: false,
                        title: "Patruljer",
                    }
                };
            };
            const getPostNames = () => {
                let names = [];
                poster.forEach(post => {
                    names.push(post.navn);
                });
                return names;
            };
            const getXTickVals = () => {
                let vals = [];
                for (let i = 0; i < poster.length; i++) {
                    vals.push(i * 3 + 1);
                }
                return vals;
            };
            const getYTickVals = () => {
                let vals = [];
                for (let i = 0; i < Master.loeb.patruljer.length; i++) {
                    if (visUdgåede || !Master.loeb.udgåedePatruljer[i])
                        vals.push(-(i + 1));
                }
                return vals;
            };
            const getYTickText = () => {
                let vals = [];
                for (let i = 0; i < Master.loeb.patruljer.length; i++) {
                    if (visUdgåede || !Master.loeb.udgåedePatruljer[i])
                        vals.push((i + 1).toString());
                }
                return vals;
            };
        })(patruljePlot = Master.patruljePlot || (Master.patruljePlot = {}));
        let meldinger;
        (function (meldinger) {
            const antalMeldinger = 6;
            meldinger.updateSidsteMeldinger = (updates) => {
                if (updates != undefined && updates != null) {
                    const list = document.getElementById('senesteUpdates');
                    for (let i = updates.length - 1; i >= 0; i--) {
                        const listElem = document.createElement('li');
                        listElem.innerHTML = updates[i].slice(updates[i].indexOf(" "));
                        lastMeldingerListArray.push(list.appendChild(listElem));
                        if (lastMeldingerListArray.length > antalMeldinger) {
                            lastMeldingerListArray.shift().remove();
                        }
                    }
                }
            };
            let lastMeldingerListArray = [];
        })(meldinger || (meldinger = {}));
        let post;
        (function (post_1) {
            post_1.loadPoster = () => {
                const container = document.getElementById("postContainer");
                container.innerHTML = "";
                for (let i = 0; i < poster.length; i++) {
                    const button = document.createElement("button");
                    let text = poster[i].navn;
                    if (poster[i].erOmvej)
                        text += " - " + (poster[i].omvejÅben ? "(Å)" : "(L)");
                    button.innerHTML = text;
                    button.value = i.toString();
                    button.setAttribute("onclick", "Client.Master.post.postClicked(this.value)");
                    container.appendChild(button);
                }
            };
            post_1.colorPoster = (postStatus) => {
                console.log(postStatus);
                const colors = ["rgb(207, 204, 153)", "rgb(255, 200, 0)", "rgb(0, 255, 0)", "rgb(0, 200, 255)", "rgb(135, 155, 161)"];
                const postButtons = (document.getElementById("postContainer").children);
                for (let i = 0; i < postButtons.length; i++) {
                    const button = postButtons[i];
                    const status = postStatus[i];
                    button.style.backgroundColor = colors[status];
                    console.log(button.innerHTML + " " + status);
                }
            };
            post_1.postClicked = (post) => {
                const p = parseInt(post);
                if (!poster[p].erOmvej) {
                    alert("Posten er ikke en omvej. Den kan ikke åbnes eller lukkes");
                    return;
                }
                const omvejLukker = poster[p].omvejÅben;
                const action = omvejLukker ? "LUKKE" : "ÅBNE";
                if (confirm(`Er du sikker på at ${poster[p].navn} skal ${action}?`)) {
                    Client.sendRequest("/postMasterUpdate", new Headers({
                        "post": post,
                        "action": action
                    }), (status, headers) => {
                        const postContainer = document.getElementById("postContainer").children[p].innerHTML = poster[p].navn + " - " + (omvejLukker ? "(L)" : "(Å)");
                        updates.forceUpdateNextTime();
                    }, (status) => {
                        alert("Der er sket en fejl. Omvejen kan ikke " + action);
                    });
                }
            };
        })(post = Master.post || (Master.post = {}));
        let patruljer;
        (function (patruljer) {
            patruljer.loadPatruljer = () => {
                const patruljerMed = document.getElementById("patruljerMed");
                const patruljerUde = document.getElementById("patruljerUde");
                patruljerMed.innerHTML = "";
                patruljerUde.innerHTML = "";
                for (let p = 0; p < Master.loeb.patruljer.length; p++) {
                    const button = document.createElement("button");
                    button.innerHTML = ClientLoebMethods.patruljeNummerOgNavn(Master.loeb, p);
                    button.value = p.toString();
                    button.setAttribute("onclick", "Client.Master.patruljer.buttonClicked(this.value)");
                    if (Master.loeb.udgåedePatruljer[p])
                        patruljerUde.appendChild(button);
                    else
                        patruljerMed.appendChild(button);
                }
            };
            patruljer.buttonClicked = (value) => {
                const p = parseInt(value);
                const patruljeSkalUdgå = ClientLoebMethods.patruljeIkkeUdgået(Master.loeb, p);
                const action = patruljeSkalUdgå ? "UDGÅ" : "GEN-INDGÅ";
                const message = `Er du sikker på at patrulje ${ClientLoebMethods.patruljeNummerOgNavn(Master.loeb, p)} skal ${action} fra løbet?`;
                if (confirm(message)) {
                    Client.sendRequest("/patruljeMasterUpdate", new Headers({
                        "pNum": value,
                        "action": action
                    }), (status, headers) => {
                        Master.loeb.udgåedePatruljer[p] = patruljeSkalUdgå;
                        patruljer.loadPatruljer();
                        updates.forceUpdateNextTime();
                    }, (status) => {
                        alert("Der er sket en fejl. Patruljen kan ikke " + action);
                    });
                }
            };
        })(patruljer = Master.patruljer || (Master.patruljer = {}));
        let updates;
        (function (updates) {
            let lastUpdateTimeString = new Date().getTime().toString();
            let secondsBetweenUpdates = 3;
            let connectionTries = 0;
            const maxConnectionTries = 10;
            const notificationAudio = new Audio("images/notification.mp3");
            notificationAudio.textTracks;
            HTMLAudioElement;
            const getMasterUpdateFunc = () => {
                const headers = new Headers({
                    'last-update': lastUpdateTimeString
                });
                lastUpdateTimeString = new Date().getTime().toString();
                Client.sendRequest("/masterUpdate", headers, (status, headers) => {
                    if (headers.get('update') == "true") {
                        notificationAudio.play();
                        const obj = JSON.parse(headers.get('data'));
                        patruljePlot.updatePatruljeOversigt(obj.patruljer, obj.ppArrays);
                        meldinger.updateSidsteMeldinger(obj.senesteUpdates);
                        post.colorPoster(obj.postStatus);
                    }
                    connectionTries = 0;
                }, status => {
                    connectionTries++;
                    if (connectionTries > maxConnectionTries) {
                        clearInterval(updateInterval);
                        if (confirm("Fejl ved opdatering. Log ind igen")) {
                            logOut();
                        }
                        else {
                            connectionTries = 0;
                            updateInterval = setInterval(getMasterUpdateFunc, secondsBetweenUpdates * 1000);
                        }
                    }
                });
            };
            let updateInterval = setInterval(getMasterUpdateFunc, secondsBetweenUpdates * 1000);
            updates.forceUpdateNextTime = () => { lastUpdateTimeString = "0"; };
        })(updates || (updates = {}));
    })(Master = Client.Master || (Client.Master = {}));
})(Client || (Client = {}));
