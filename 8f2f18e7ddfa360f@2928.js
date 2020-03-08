// https://observablehq.com/@zavierhenry/2016-vote-allocation-map-by-county@2928
import define1 from "./8d271c22db968ab0@158.js";
import define2 from "./a33468b95d0b15b0@692.js";

export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], function(md){return(
md`# 2016 Vote Allocation Map

This interface allows you to make custom 2016 national election maps by county and by state. Scroll down to see the results of your custom map at the county and state level`
)});
  main.variable(observer()).define(["md"], function(md){return(
md`# Map Interface
This interface allows you to make custom United States voting maps at the county and national level. Along with each candidate there is a section for "tossup" votes which represents unallocated votes in a region. Features of the interface are described below.

---
### Allocating a specific region

Click on the region to bring up a popup to change votes for each candidates. The "tossup" row cannot be edited. Click on a candidate to open the form for changing either vote totals or the vote percentage.

---
### Allocating multiple regions based on population size

Click on the candidate in the legend. This allows you to change the candidate percentage of regions based on size. The first two ranges set the smallest and largest region to change; the third sets the percentage. Click "Apply Range" to apply the changes to the map.

---
### Allocating multiple highlighted regions

Activate multiple region mode by click the bottom "Show Multiple Region Change". This allows you to change the candidate percentage of multiple regions at once. Click the states that you want to edit, set the candidate and percentage, then click "Apply" to apply the changes. Click on "Hide Multiple Region Change" to exit this mode.

---
### Switching between state and county maps

Use the buttons at the bottom right corner to switch between the county map and the state map

---
### Editing and deleting a candidate

To edit a candidate, click on the candidate in the legend. From there, you can change both the name of the candidate and the color that represents it. To delete the candidate, click the delete button after clicking the candidate in the legend. The "tossup" row cannot be edited.

---
### Adding a new candidate

To add a new candidate, press the bottom right plus button at the bottom of the legend. You may need to scroll down to the bottom for the button to show.

<br>
<br>
`
)});
  main.variable(observer("viewof leafletMap")).define("viewof leafletMap", ["html","L","ElectionState","electionTotals","createRegionResultPopup","topojson","us","coordsToLatLng","createNationResultLegend"], function*(html,L,ElectionState,electionTotals,createRegionResultPopup,topojson,us,coordsToLatLng,createNationResultLegend)
{
  
  const countyContainer = html`<div style='height: 1200px;'></div>`
  yield countyContainer
  
  const map = L.map(countyContainer, {
    center: [37.8, -96],
    zoom: 5,
    zoomDelta: 2,
  })
  
  const openStreetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  });
  
  let countyElectionState = new ElectionState(
    "Election Results by County", 
    electionTotals.filter(([code, _]) => code.length == 5),
  )
  
  let stateElectionState = new ElectionState(
    "Election Results by State",
    electionTotals.filter(([code, _]) => code.length == 2),
  )
  
  countyContainer.value = {
    county: countyElectionState,
    state: stateElectionState
  }
  
  function style(electionState) {
    return feature => {
      var region = electionState.getRegion(feature.id),
          winner = region.winner
      
      return {
        fillColor: electionState.getCandidate(winner.id).color(winner.margin),
        color: 'white',
        weight: 0.5
      }
    }
  }
  
  function highlightFeature(e) {
    var layer = e.target
    
    layer.setStyle({
        weight: 2,
        color: '#666',
    });
    
    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
  }
  
  let activeGeojsonLayer, nationTotal
  function resetHighlight(e) {
    activeGeojsonLayer.resetStyle(e.target)
  }
  
  function onEachFeature(electionState) { 
    return function(feature, layer) {
      layer.on({
        add: () => layer.clicked = false,
        mouseover: e => {
         if (!layer.clicked) {
           highlightFeature(e)
         }
        },
        //mouseout: resetHighlight,
        mouseout: e => {
          if (!layer.clicked) {
            resetHighlight(e)
          }
        },
        click: e => {
          if (nationTotal.multimode.enabled) {
            if (layer.clicked) {
              resetHighlight(e)
              nationTotal.multimode.regions.delete(feature.id)
            } else {
              highlightFeature(e)
              nationTotal.multimode.regions.add(feature.id)
            }
            layer.clicked = !layer.clicked
          } else {
            map.fitBounds(e.target.getBounds())
            var regionId = feature.id,
                popup = createRegionResultPopup(activeGeojsonLayer, feature, layer, electionState, regionId, nationTotal)
            popup.setLatLng(e.latlng).openOn(map)
          }
        }
      })
    }
  }
  
  var borderStyle = {
    color: 'white',
    fillColor: 'none',
    weight: 1
  }
  
  openStreetMap.addTo(map)
  
  let countyArea = L.geoJSON(topojson.feature(us, us.objects.counties).features, {
    style: style(countyElectionState),
    coordsToLatLng, 
    onEachFeature: onEachFeature(countyElectionState)
  }).addTo(map)
  
  nationTotal = createNationResultLegend(countyElectionState, countyArea, map)
  nationTotal.addTo(map)
  
  
  var stateBorder = L.geoJSON(topojson.mesh(us, us.objects.states, (a, b) => a !== b), { 
    style: borderStyle, 
    coordsToLatLng 
  }).addTo(map)
  
  let stateArea = L.geoJSON(topojson.feature(us, us.objects.states).features, {
    style: style(stateElectionState),
    coordsToLatLng, 
    onEachFeature: onEachFeature(stateElectionState)
  })
  
  activeGeojsonLayer = countyArea
  
  var mapTypeControl = L.control({position: 'bottomright'})
  mapTypeControl.onAdd = () => {
    mapTypeControl._div = html`
      <div>
        <form>
          <input type="radio" name="mapType" value="county" checked>County Map
          <input type="radio" name="mapType" value="state">State Map
        </form>
      </div>
    `
    mapTypeControl._div.addEventListener('change', e => {
      nationTotal.multimode.regions.clear()
      activeGeojsonLayer.resetStyle().remove()
      
      switch (e.target.value) {
        case 'county':
          //add county layers
          activeGeojsonLayer = countyArea
          
          stateBorder.addTo(map)
          nationTotal.setElectionState(countyElectionState)
          //nationTotal.setLayer(countyArea)
          
          break
        case 'state':
          //remove county layer
          stateBorder.remove()
          
          //add state layer
          activeGeojsonLayer = stateArea
          nationTotal.setElectionState(stateElectionState)
      }
      
      activeGeojsonLayer.addTo(map)
      nationTotal.setLayer(activeGeojsonLayer)
      
    })
    
    return mapTypeControl._div
  }
  
  mapTypeControl.addTo(map)
  
}
);
  main.variable(observer("leafletMap")).define("leafletMap", ["Generators", "viewof leafletMap"], (G, _) => G.input(_));
  main.variable(observer("countyMapResults")).define("countyMapResults", ["md"], function(md){return(
md`# County Map Results

This is the county level result of using the map interface. Each circle represents a county. The larger the circle, the bigger the population of the county. The color represents the winner of the county, with the intensity of the color representing the margin of victory. The grayer the color, the closer the margin of victory

Hover over the circle for more information on the county. You can click on the 3 dots to the left when hovering over the map to download the map as a PNG or SVG. 

Inspiration for map shape and some of the code used to make said shape comes from [this ObservableHQ project](https://observablehq.com/@karimdouieb/try-to-impeach-this-challenge-accepted).`
)});
  main.variable(observer()).define(["leafletMap","countyChartTemplate","states","d3","svg"], function(leafletMap,countyChartTemplate,states,d3,svg)
{
  let electionState = leafletMap.county
  
  countyChartTemplate.countySelection
    .style('fill', d => {
      var winner = electionState.getRegion(d.id).winner
      return electionState.getCandidate(winner.id).color(winner.margin)
    })
  
  countyChartTemplate.titles.text(d => {
    let winner = electionState.getRegion(d.id).winner
    return `${d.properties.name}, ${states.get(d.id.slice(0, 2)).name}
            Winner: ${electionState.getCandidate(winner.id).name}
            Percentage: ${winner.percentage}%
            Margin: ${winner.margin}`
  })
  
  let totals = electionState.totals,
      regionTotal = totals.reduce((x, y) => x + y[1], 0)
  
  let candidateRows = countyChartTemplate.candidates
    .selectAll("g")
    .data(Array.from(electionState.candidates, ([id, candidate]) => (
      {
        id,
        name: candidate.name, 
        color: candidate.maxColor, 
        total: totals.find(([cid, _]) => cid === id)[1]
      }
    )).sort((a, b) => d3.descending(a.total, b.total)))
    .join(enter => {
      let rows = enter.append('g')
      rows.append(() => svg`<circle class="candidate-color" cx="15" cy="15" r="15"/>`)
      
      let candidateText = rows.append(() => svg`
        <text transform="translate(${30+15},15)">
          <tspan class="percentage" dx="5"></tspan>
          <tspan class="name" dx="20"></tspan>
          <tspan class="total" dx="25"></tspan>
        </text>
      `)
      
      candidateText.append("tspan").classed("percentage", true).attr("dx", 5)
      candidateText.append("tspan").classed("name", true).attr("dx", 20)
      candidateText.append("tspan").classed("total", true).attr("dx", 25)
      
      return rows
    })
      .attr('transform', (_, i) => `translate(0,${i * 70})`)
  
  countyChartTemplate.svg.attr('viewBox', [0,0,975,700+70*candidateRows.size()+15])
  
  candidateRows.select(".candidate-color").style("fill", ({color}) => color)
  candidateRows.select(".percentage").text(d => `${Math.round(d.total/regionTotal * 10000) / 100}%`)
  candidateRows.select(".name").text(d => d.name)
  candidateRows.select(".total").text(d => d.total.toLocaleString('en'))

  
  return countyChartTemplate.svg.node()
  
}
);
  main.variable(observer()).define(["md"], function(md){return(
md`# State Map Results

This is the state level map result of using the map interface. The color scheme is the same as the county map. Just like the county map, you can hover over each region to learn more. See the [County Map Results](https://observablehq.com/d/8f2f18e7ddfa360f#countyMapResults) section to learn how to download the map as a SVG or PNG`
)});
  main.variable(observer()).define(["leafletMap","stateChartTemplate","d3","svg"], function(leafletMap,stateChartTemplate,d3,svg)
{
  let electionState = leafletMap.state
  
  stateChartTemplate.stateSelection
    .style('fill', d => {
      var winner = electionState.getRegion(d.id).winner
      return electionState.getCandidate(winner.id).color(winner.margin)
    })
  
  stateChartTemplate.titles.text(d => {
    let winner = electionState.getRegion(d.id).winner
    return `${d.properties.name}
            Winner: ${electionState.getCandidate(winner.id).name}
            Percentage: ${winner.percentage}%
            Margin: ${winner.margin}`
  })
  
  let totals = electionState.totals,
      regionTotal = totals.reduce((x, y) => x + y[1], 0)
  
  let candidateRows = stateChartTemplate.candidates
    .selectAll("g")
    .data(Array.from(electionState.candidates, ([id, candidate]) => (
      {
        id,
        name: candidate.name, 
        color: candidate.maxColor, 
        total: totals.find(([cid, _]) => cid === id)[1]
      }
    )).sort((a, b) => d3.descending(a.total, b.total)))
    .join(enter => {
      let rows = enter.append('g')
      
      rows.append(() => svg`<circle class="candidate-color" cx="15" cy="15" r="15"/>`)
      
      let candidateText = rows.append(() => svg`
        <text transform="translate(${30+15},15)">
          <tspan class="percentage" dx="5"></tspan>
          <tspan class="name" dx="20"></tspan>
          <tspan class="total" dx="25"></tspan>
        </text>
      `)
      
      return rows
    })
      .attr('transform', (_, i) => `translate(0,${i * 70})`)
  
  stateChartTemplate.svg.attr('viewBox', [0,0,975,700+70*candidateRows.size() + 15])
  
  candidateRows.select(".candidate-color").style("fill", ({color}) => color)
  candidateRows.select(".percentage").text(d => `${Math.round(d.total/regionTotal * 10000) / 100}%`)
  candidateRows.select(".name").text(d => d.name)
  candidateRows.select(".total").text(d => d.total.toLocaleString('en'))
  
  return stateChartTemplate.svg.node()
  
}
);
  main.variable(observer("countyChartTemplate")).define("countyChartTemplate", ["d3","createSimulation","counties"], function(d3,createSimulation,counties)
{
  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, 975, 900])

  const simulation = createSimulation(counties)
  
  const countySelection = svg.append("g")
    .selectAll("path")
    .data(counties)
    .join("circle")
      .classed("county-path", true)
    
  const titles = countySelection.append("title");
  
  const candidates = svg.append("g")
    .attr("transform", "translate(70,700)")
  
  simulation.on('tick', () => {
    countySelection
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", d => d.properties.radius)
  })
  
  return {
    svg: svg,
    countySelection: countySelection,
    titles: titles,
    candidates
  }
  
}
);
  main.variable(observer("stateChartTemplate")).define("stateChartTemplate", ["d3","topojson","us","path"], function(d3,topojson,us,path)
{
  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, 975, 900])
  
  const stateSelection = svg.append("g")
    .selectAll("path")
    .data(topojson.feature(us, us.objects.states).features)
    .join("path")
      .classed("county-path", true)
      .style("stroke", "white")
      .attr("d", path)
    
  const titles = stateSelection.append("title");
  
  svg.append("path")
    .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
    .attr("fill", "none")
    .style("stroke", "white")
    .attr("stroke-linejoin", "round")
    .attr("d", path);
  
  const candidates = svg.append("g")
    .attr("transform", "translate(70,700)")
  
  return {
    svg: svg,
    stateSelection: stateSelection,
    titles: titles,
    candidates
  }
  
}
);
  main.variable(observer("createNationResultLegend")).define("createNationResultLegend", ["L","candidateForm","html","createResultTable","rangeWithNumber","d3","form","updateResultTable"], function(L,candidateForm,html,createResultTable,rangeWithNumber,d3,form,updateResultTable){return(
function createNationResultLegend(electionState, layer, map) {
  let control = L.control({position: 'bottomleft'})
  
  control._electionState = electionState
  control._layer = layer
  
  let onClickCandidateRow = function(_d, i, nodes) {
    let id = +(nodes[i].dataset.id),
        infoForm = control._div.querySelector(`.candidate-info[data-id="${id}"]`)
    
    if (infoForm == null) {
      let electionState = control._electionState,
          candidateInfo = candidateForm(electionState, id)
      
      candidateInfo.addEventListener('input', e => {
        let {color, name} = candidateInfo.value,
            candidate = control._electionState.getCandidate(id)
        
        if (candidate.maxColor != color || candidate.name != name) {
          candidate.color = color, candidate.name = name
          control.update()
        } else {
          e.stopPropagation()
        }
      })
      
      let applyButton = candidateInfo.querySelector('input[name="apply-button"]')
      applyButton.addEventListener('click', () => {
        let {startArea, endArea, percentage} = candidateInfo.value
        control._electionState.setCandidateRegionRangePercentage(id, startArea, endArea, percentage)
        control.update()
        map.getContainer().dispatchEvent(new CustomEvent('input'))                                           
      })
      
      let deleteButton = candidateInfo.querySelector('input[name="delete-button"]')
      deleteButton.addEventListener('click', () => {
        control._electionState.removeCandidate(id)
        nodes[i].parentNode.querySelector(`.candidate-info[data-id="${id}"]`).remove()
        control.update()
        map.getContainer().dispatchEvent(new CustomEvent('input'))
      })
      
      nodes[i].parentNode.insertBefore(
        html`<tr class="candidate-info" data-id="${id}"><td colspan="3">${candidateInfo}</td></tr>`,
        nodes[i].nextSibling
      )
      
    } else {
      infoForm.remove()
    }
    
  }
  
  control.onAdd = () => {
    let candidates = control._electionState.candidates,
        candidateTotals = control._electionState.totals,
        title = "Total Election Count"
    
    let content = createResultTable(candidates, candidateTotals, control._electionState.otherId, title, onClickCandidateRow)
    control._div = content
    
    let multiButton = html`<button type='button'>Show Multiple Region Change</button>`
    let addCandidateButton = html`<button type='button' style='float: right;'>+</button>`
    let multiArea = html`<div style="overflow: hidden;">${multiButton}${addCandidateButton}</div>`
    
    control.multimode = {
      enabled: false,
      regions: new Set(),
      candidate: null,
      percentage: 0
    }
    
    addCandidateButton.addEventListener('click', e => {
      control._electionState.addNewCandidate()
      control.update()
      map.getContainer().dispatchEvent(new CustomEvent('input'))
    })
    
    multiButton.addEventListener('click', () => {
      control.multimode.enabled = !control.multimode.enabled
      
      if (control.multimode.enabled) {
        multiButton.innerHTML = "Hide Multiple Region Change"
        let applyButton = html`<input type="button" name="apply-button" value="Apply" />`
        let range = rangeWithNumber("percentage", 0, 100, 0.01)
        let multiForm = html`<form></form>`
        
        d3.select(multiForm)
          .selectAll('div')
          .data(Array.from(control._electionState.candidates).filter(([id, _]) => id != control._electionState.otherId))
          .join( 
            enter => enter.append(([id, c]) => (
              html`<div><input type="radio" name="candidate" value="${id}"/>${c.name}</div>`
            )).select('input').property('checked', (_, i) => i == 0),
            update => update.text(([_, c]) => c.name).select('input').attr('value', ([id, _]) => id)
              .property('checked', (_, i) => i == 0)
          )
        
        multiForm.appendChild(range), multiForm.appendChild(applyButton)
        let multimodeForm = form(multiForm)
        
        multimodeForm.addEventListener('input', e => {
          control.multimode.percentage = multimodeForm.value.percentage
          control.multimode.candidate = +multimodeForm.value.candidate
          e.stopPropagation()
        })
        
        d3.select(range).property('value', control.multimode.percentage)
          .selectAll('input').property('value', control.multimode.percentage)
        
        applyButton.addEventListener('click', () => {
          let multimode = control.multimode
          multimode.regions.forEach(regionId => {
            control._electionState.setCandidateRegionPercentage(regionId, multimode.candidate, multimode.percentage)
          })
          multimode.regions.clear()
          control.update()
          control._layer.eachLayer(layer => layer.clicked = false)
          map.getContainer().dispatchEvent(new CustomEvent('input'))
          
        })
        
        multimodeForm.setAttribute('id', 'multimodeForm')
        multiArea.appendChild(multimodeForm)
        
      } else {
        multiButton.innerHTML = "Show Multiple Region Change"
        d3.select(multiArea).select('#multimodeForm').remove()
        control.multimode.regions.clear()
        control._layer.resetStyle()
      }
    })
    
    d3.select(content)
      .attr('id', 'nationLegend')
      .classed('legend', true)
      .on('mouseenter', () => map.dragging.disable(), map.doubleClickZoom.disable())
      .on('mouseleave', () => map.dragging.enable(), map.doubleClickZoom.enable())
      .append(() => multiArea)
    
    return content
  }
  
  control.setElectionState = (electionState) => {
    control._electionState = electionState
    control.update()
  }
  
  control.setLayer = (layer) => control._layer = layer
  
  control.update = function() {
    var candidates = control._electionState.candidates,
        candidateTotals = control._electionState.totals
    
    updateResultTable(candidates, candidateTotals, control._electionState.otherId, this._div, onClickCandidateRow)
    control._layer.resetStyle()
  }
  
  return control
}
)});
  main.variable(observer("createRegionResultPopup")).define("createRegionResultPopup", ["L","us","rangeWithNumber","d3","form","html","createResultTable","updateResultTable"], function(L,us,rangeWithNumber,d3,form,html,createResultTable,updateResultTable){return(
function createRegionResultPopup(activeLayer, feature, regionLayer, electionState, regionId, control) {
  var popup = L.popup({maxWidth: 1500, maxHeight: 1200})
  
  var state = us.objects.states.geometries.find(x => x.id == feature.id.substring(0, 2)),
      title = `${feature.properties.name}, ${state.properties.name}`
  
  var region = electionState.getRegion(regionId),
      candidates = electionState.candidates
  
  var candidateTotals = Array.from(region)
  
  let candidateRowOnClick = function() {
    let id = +this.dataset.id
    
    let currentForm = popup.getContent().querySelector(`.candidate-form[data-id="${id}"]`)
    if (currentForm == null) {
      let totalVoteSlider = rangeWithNumber('votes', 0, region.total, 1),
          percentageSlider = rangeWithNumber('percentage', 0, 100, 0.01),
          t = region.getTotal(id)
      
      d3.select(totalVoteSlider).property('value', t)
        .selectAll('input').property('value', t)
      
      d3.select(percentageSlider).property('value', region.getPercentage(id))
        .selectAll('input').property('value', region.getPercentage(id))
      
      totalVoteSlider.addEventListener('input', e => {
        let percentage = Math.round(e.target.value / region.total * 10000) / 100
        if (percentage != percentageSlider.value) {
          d3.select(percentageSlider).property('value', percentage)
            .selectAll('input').property('value', percentage)                       
        }
      })
      
      percentageSlider.addEventListener('input', e => {
        let total = Math.ceil(region.total * e.target.value / 100)
        if (total != totalVoteSlider.value) {
          d3.select(totalVoteSlider).property('value', total)
            .selectAll('input').property('value', total)
        }
      })
      
      let candidateForm = form(html`
        <form>
          <div id="totalVotes">Total Votes</div>
          ${totalVoteSlider}
          <div id="percentage">Vote Percentage</div>
          ${percentageSlider}
        </form>
      `)
      
      candidateForm.addEventListener('input', () => {
        electionState.setCandidateRegionTotal(regionId, id, candidateForm.value.votes)
        activeLayer.resetStyle(regionLayer)
        popup.fire('input')
        control.update(electionState)
      })
      
      this.parentNode.insertBefore(
        html`<tr class="candidate-form" data-id="${id}"><td colspan="3">${candidateForm}</td></tr>`,
        this.nextSibling
      )
      
    } else {
      currentForm.remove()
    }
  }
  
  let content = createResultTable(candidates, candidateTotals, electionState.otherId, title, candidateRowOnClick)
  
  popup.on('input', () => {
    let content = popup.getContent()
    candidateTotals = Array.from(region)
    updateResultTable(candidates, candidateTotals, electionState.otherId, content, candidateRowOnClick)
  })
  
  popup.setContent(content)
  return popup
}
)});
  main.variable(observer("createResultTable")).define("createResultTable", ["html","updateResultTable"], function(html,updateResultTable){return(
function createResultTable(candidates, candidateTotals, tossupId, title, onClick) {
  
  var content = html`
    <div class='election-result'>
      <div class='popup-title'>${title}</div>
      <table cellpadding='5px'>
        <tr>
          <th>Party Color</th>
          <th>Percentage</th>
          <th>Name</th>
          <th>Votes</th>
        </tr>
      </table>
    </div>
  `
  
  updateResultTable(candidates, candidateTotals, tossupId, content, onClick)
  return content
  
}
)});
  main.variable(observer("updateResultTable")).define("updateResultTable", ["d3","svg"], function(d3,svg){return(
function updateResultTable(candidates, candidateTotals, tossupId, resultTable, onClick) {
  var regionTotal = Array.from(candidateTotals).reduce((x, y) => x + y[1], 0)
  var candidateRows = d3.select(resultTable)
    .select('table')
    .selectAll('tr.candidate-row')
    .data(candidateTotals)
    .join(enter => {
      let row = enter.append('tr')
        .classed('candidate-row', true)
        
      row.append('svg')
        .attr('viewBox', [0,0,20,30])
        .append(() => svg`<circle transform="translate(10,15)" r="3"/>`)
  
      row.append('td').append('span')
      row.append('td').append('span')
      row.append('td').append('span')
      
      return row
    })
      .attr('data-id', ([id, _]) => id)
      .each(function([id, t]) {
        
        d3.select(this).select('circle')
          .style('fill', candidates.get(id).maxColor)
      
        var info = d3.select(this).selectAll('span')
        info.text((_, i, nodes) => {
          if (i == 0) {
            return `${Math.round(t / regionTotal * 10000) / 100}%`
          } else if (i == 1) {
            return candidates.get(id).name
          } else if (i == 2) {
            return t.toLocaleString('en')
          }
        })
      })
  
  candidateRows.filter(([id, _]) => id != tossupId)
    .on('mouseenter', (_, i, nodes) => nodes[i].classList.add('focused'))
    .on('mouseleave', (_, i, nodes) => nodes[i].classList.remove('focused'))
    .on('click', onClick)
  
}
)});
  main.variable(observer("coordsToLatLng")).define("coordsToLatLng", ["L","inversion"], function(L,inversion){return(
function coordsToLatLng(coords) {
  return L.GeoJSON.coordsToLatLng(inversion(coords))
}
)});
  main.variable(observer("inversion")).define("inversion", ["d3"], function(d3){return(
d3.geoAlbersUsa().scale(1300).translate([487.5, 305]).invert
)});
  main.variable(observer("candidateForm")).define("candidateForm", ["rangeWithNumber","html","d3","form"], function(rangeWithNumber,html,d3,form){return(
(electionState, candidateId) => {
  var candidate = electionState.getCandidate(candidateId),
      maxAreas = electionState.regionCount
  
  var startState = rangeWithNumber('startArea', 1, maxAreas, 1),
      endState = rangeWithNumber('endArea', 1, maxAreas, 1),
      percentage = rangeWithNumber('percentage', 0, 100, 0.01),
      nameInput = html`<input type="text" name="name" placeholder="Enter candidate name..."/>`,
      colorInput = html`<input type="color" name="color" value="${candidate.maxColor}"/>`
  
  if (candidate.name != "") {
    nameInput.value = candidate.name
  }
      
  startState.addEventListener('input', e => {
    if (+e.target.value > +endState.value) {
      startState.value = endState.value
      d3.select(startState).selectAll('input').property('value', endState.value)
    }
  })
  
  endState.addEventListener('input', e => {
    if (+e.target.value < +startState.value) {
      endState.value = startState.value
      d3.select(endState).selectAll('input').property('value', startState.value)
    }
  })
  
  d3.select(startState).property('value', 1)
    .selectAll('input').property('value', 1)
  
  d3.select(endState).property('value', maxAreas)
    .selectAll('input').property('value', maxAreas)
  
  d3.select(percentage).property('value', 50)
    .selectAll('input').property('value', 50)
  
  var cform = form(html`
    <form>
      ${nameInput}
      ${colorInput}<br>
      ${startState}
      ${endState}
      ${percentage}
      <div>
        <input type="button" name="apply-button" value="Apply Range"/>
        <input type="button" name="delete-button" style="float: right;" value="Delete"/>
      </div>
      
    </form>
    `)
  
  return cform
}
)});
  main.variable(observer("ElectionState")).define("ElectionState", ["Candidate","Region","d3"], function(Candidate,Region,d3){return(
class ElectionState {
  constructor(title, totals) {
    this._labeler = 3
    this._title = title
    this.otherId = 0
    
    var candidates = [
      [1, new Candidate('Elaine Marley', '#0015BC')],
      [2, new Candidate('Charles L. Charles', '#E9141D')],
      [this.otherId, new Candidate('Tossup', '#9E8767')]
    ]
    
    this._totals = new Map([[1,0], [2,0], [this.otherId, totals.reduce((x, y) => x + y[1], 0)]])
    
    this._candidates = new Map(candidates)
    this._regions = new Map(totals.map(([id, total]) => [id, new Region(total, [1,2], this.otherId)]))
    
    this._sortedRegions = totals.sort((a, b) => d3.descending(a[1], b[1])).map(([id, _]) => id)
  }
  
  get candidates() {
    return this._candidates
  }
  
  get regionCount() {
    return this._regions.size
  }
  
  getRegion(regionId) {
   return this._regions.get(regionId) 
  }
  
  getCandidate(candidateId) {
   return this._candidates.get(candidateId) 
  }
  
  get totals() {
    return Array.from(this._totals)
  }
  
  setCandidateRegionTotal(regionId, candidateId, total) {
    let region = this._regions.get(regionId)
    
    for (let [id, t] of region) {
      this._totals.set(id, this._totals.get(id) - t)
    }
    
    region.setTotal(candidateId, total)
    
    for (let [id, t] of region) {
      this._totals.set(id, this._totals.get(id) + t)
    }
    
  }
  
  setCandidateRegionPercentage(regionId, candidateId, percentage) {
    let region = this._regions.get(regionId)
    
    for (let [id, t] of region) {
      this._totals.set(id, this._totals.get(id) - t)
    }
    
    region.setPercentage(candidateId, percentage)
    
    for (let [id, t] of region) {
      this._totals.set(id, this._totals.get(id) + t)
    }
    
  }
  
  setCandidateRegionRangePercentage(id, startRegion, endRegion, percentage) {
    this._sortedRegions.slice(startRegion-1, endRegion).forEach(regionId => {
      this.setCandidateRegionPercentage(regionId, id, percentage)
    })
  }
  
  addNewCandidate() {
    var id = this._labeler++
    this._candidates.set(id, new Candidate(`Candidate ${id}`, '#000000'))
    
    this._regions.forEach(region => region.addCandidate(id))
    this._totals.set(id, 0)
    
    return id
  }
  
  removeCandidate(candidateId) {
    
    let total = this._totals.get(candidateId)    
    this._regions.forEach(region => region.removeCandidate(candidateId))
    this._totals.delete(candidateId), this._candidates.delete(candidateId)
    this._totals.set(this.otherId, this._totals.get(this.otherId) + total)
    
  }
  
 }
)});
  main.variable(observer("Region")).define("Region", ["d3"], function(d3){return(
class Region {
  constructor(total, candidateIds, otherId) {
    this._total = total
    this._otherId = otherId
    this._votes = new Map([...candidateIds.map(id => [id, 0]), [otherId, total]])
    
  }
  get total() {
    return this._total
  }
  get winner() {
    var topTwo = Array.from(this._votes).sort((a, b) => d3.descending(a[1], b[1])).slice(0, 2)
    var [winnerId, winnerTotal] = topTwo[0],
        percentage = Math.round(winnerTotal / this._total * 10000) / 100,
        margin = percentage
    
    if (topTwo.length == 2) {
      margin = percentage - Math.round(topTwo[1][1] / this._total * 10000) / 100
    }
    
    return {id: winnerId, total: winnerTotal, percentage, margin}
  }
  addCandidate(id) {
    this._votes.set(id, 0)
  }
  removeCandidate(id) {
    this.setTotal(id, 0)
    this._votes.delete(id)
  }
  
  getPercentage(id) {
    return Math.round(this._votes.get(id) / this._total * 10000) / 100 
  }
  
  setPercentage(id, p) {
    var t = Math.ceil(this._total * p / 100)
    this.setTotal(id, t)
  }
  
  getTotal(id) {
   return this._votes.get(id) 
  }
  
  setTotal(id, t) {
    let oldTotal = this._votes.get(id),
        availableVotes = this._votes.get(this._otherId)
    
    this._votes.set(id, t)
    
    if ((t - oldTotal - availableVotes) > 0) {
      this._votes.set(this._otherId, 0) 
      let spreadTotal = this._total - t,
          remainder = spreadTotal
      
      for (let [candidateId, candidateTotal] of this._votes) {
        if (!(candidateId == id || candidateId == this._otherId)) {
          let newTotal = Math.floor(candidateTotal / (this._total - oldTotal - availableVotes) * spreadTotal)
          this._votes.set(candidateId, newTotal)
          remainder -= newTotal
        }
      }
      
      if (remainder > 0) {
        for (let [candidateId, candidateTotal] of this._votes) {
          if (!(candidateId == id || candidateId == this._otherId)) {
            this._votes.set(candidateId, candidateTotal + 1)
            remainder--
            if (remainder <= 0) {
              break
            }
          }
        }
      }
      
    } else {
      this._votes.set(this._otherId, this._votes.get(this._otherId) + oldTotal - t)
    }
      
  }
  [Symbol.iterator]() {
    return this._votes.entries()
  }
}
)});
  main.variable(observer("Candidate")).define("Candidate", ["createColor"], function(createColor){return(
class Candidate {
  constructor(name, color) {
    this._name = name
    this._color = createColor(color)
  }
  get name() {
    return this._name
  }
  set name(newName) {
    this._name = newName
  }
  get color() {
    return this._color
  }
  set color(maxColor) {
    this._color = createColor(maxColor)
  }
  get maxColor() {
    return this._color(100)
  }
}
)});
  main.variable(observer("createColor")).define("createColor", ["d3"], function(d3){return(
color => {
  var length = 20
  var scale = d3.scaleLinear()
    .domain([0, 100])
    .range(['#CDCDCD', color])
  
  return x => d3.color(scale(x)).formatHex()
}
)});
  main.variable(observer("rangeWithNumber")).define("rangeWithNumber", ["html"], function(html){return(
(name, min, max, step) => {
  var range = html`<input type="range" name="${name}" min="${min}" max="${max}" step="${step}" value="${min}" defaultValue="${min}" style="width: auto;"/>`
  var number = html`<input type="number" name="${name}" min="${min}" max="${max}" step="${step}" value="${min}" defaultValue="${min}" style="width: auto;"/>`
  
  range.addEventListener('input', () => {
    if (range.value != number.value) number.value = range.value
  })
  
  number.addEventListener('input', () => { 
    if (range.value != number.value) range.value = number.value 
  })
  
  var container = html`<div>${range}${number}</div>`
  container.addEventListener('input', () => container.value = range.value)
  
  return container
}
)});
  main.variable(observer()).define(["html"], function(html){return(
html`
  <style>

    .election-result {
      padding: 5px 2px;
      overflow-y: auto;
      height: 475px;
    }

    .election-result div {
      padding: 3px 2px;
    }

    .popup-title {
      text-align: center;
    }
    
    .election-result table {
      
    }
    
    .election-results tr {
      padding: 3px 1px;
    }

    .info {
      padding: 6px 8px;
      font: 14px/16px Arial, Helvetica, sans-serif;
      background: white;
      background: rgba(255,255,255,0.8);
      box-shadow: 0 0 15px rgba(0,0,0,0.2);
      border-radius: 5px;
      display: auto;
      width: 120%;
      
    }
    .info h4 {
        margin: 0 0 5px;
        color: #777;
    }

    .legend {
      padding: 6px 8px;
      font: 14px/16px Arial, Helvetica, sans-serif;
      background: white;
      background: rgba(255,255,255,0.8);
      box-shadow: 0 0 15px rgba(0,0,0,0.2);
      border-radius: 3px;
    }

    .candidate-row.focused {
      background-color: #cdcdcd;
    }

  </style>
`
)});
  main.variable(observer("radiusScale")).define("radiusScale", ["d3","electionTotals"], function(d3,electionTotals)
{
  const populationMax = d3.max(electionTotals, ([_, count]) => count)
  const maxRadius = 25
  
  return d3.scaleSqrt()
    .domain([0, populationMax])
    .range([1, maxRadius])
}
);
  main.variable(observer("counties")).define("counties", ["topojson","us","electionTotals","turf","radiusScale","d3"], function(topojson,us,electionTotals,turf,radiusScale,d3){return(
topojson.feature(us, us.objects.counties).features.map(county => {
  const state = us.objects.states.geometries.find(state => state.id === county.id.substring(0, 2))
  const [_, count] = electionTotals.find(([id, _]) => id === county.id)
  
  return {
    ...county,
    properties: {
      ...county.properties,
      state: state.properties.name,
      population: count,
      centroid: turf.centroid(county.geometry).geometry.coordinates,
      radius: radiusScale(count)
    }
  }
})
.sort((a, b) => d3.descending(a.properties.population, b.properties.population))
.map(d => {
  let geometry
  if (d.geometry.type !== "MultiPolygon") {
    geometry = d.geometry
  } else {
    geometry = {
      type: d.geometry.type,
      coordinates: d.geometry.coordinates.sort((a, b) => d3.descending(turf.area(turf.polygon(a)), turf.area(turf.polygon(b)))).slice(0, 1)
    }
  }
  
  return {
    ...d,
    geometry
  }
})
)});
  main.variable(observer("createSimulation")).define("createSimulation", ["d3","invalidation"], function(d3,invalidation){return(
function createSimulation(nodes) {
  const nodePadding = 0.1
  
  const simulation = d3.forceSimulation(nodes)
    .force("cx", d3.forceX().x(_d => 975 / 2).strength(0.02))
    .force("cy", d3.forceY().y(_d => 610 / 2).strength(0.02))
    .force("x", d3.forceX().x(d => d.properties.centroid[0]).strength(0.3))
    .force("y", d3.forceY().y(d => d.properties.centroid[1]).strength(0.3))
    .force("charge", d3.forceManyBody().strength(-1))
    .force("collide", d3.forceCollide().radius(d => d.properties.radius + nodePadding).strength(1))
    .alphaMin(0.01)
  
  invalidation.then(() => simulation.stop())
  return simulation
  
}
)});
  main.variable(observer("electionTotals")).define("electionTotals", ["d3"], async function(d3){return(
await
d3.csv("https://gist.githubusercontent.com/ZavierHenry/a3035f06be9b1461daf74ce2032aa362/raw/ca78ec931708fb3db804e38e259631cd144fafaf/election_count.csv", ({code, count}) => [code,+count])
)});
  main.variable(observer("color")).define("color", ["d3"], function(d3){return(
d3.scaleQuantize([1, 10], d3.schemeOranges[9])
)});
  main.variable(observer("path")).define("path", ["d3"], function(d3){return(
d3.geoPath()
)});
  main.variable(observer("states")).define("states", ["us"], function(us){return(
new Map(us.objects.states.geometries.map(d => [d.id, d.properties]))
)});
  main.variable(observer("us")).define("us", ["d3"], function(d3){return(
d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-albers-10m.json")
)});
  main.variable(observer("turf")).define("turf", ["require"], function(require){return(
require("@turf/turf@5")
)});
  main.variable(observer("topojson")).define("topojson", ["require"], function(require){return(
require("topojson-client@3")
)});
  main.variable(observer("d3")).define("d3", ["require"], function(require){return(
require("d3@5")
)});
  main.variable(observer("L")).define("L", ["require","html"], async function(require,html)
{
  const L = await require("leaflet@1/dist/leaflet.js");
  if (!L._style) {
    const href = await require.resolve("leaflet@1/dist/leaflet.css");
    document.head.appendChild(L._style = html`<link href=${href} rel=stylesheet>`);
  }
  return L;
}
);
  const child1 = runtime.module(define1);
  main.import("form", child1);
  const child2 = runtime.module(define2);
  main.import("legend", child2);
  return main;
}
