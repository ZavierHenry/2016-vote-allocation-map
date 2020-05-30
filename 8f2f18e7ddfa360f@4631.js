// https://observablehq.com/@zavierhenry/2016-vote-allocation-map-by-county@4631
import define1 from "./b2bbebd2f186ed03@1005.js";
import define2 from "./8d271c22db968ab0@158.js";
import define3 from "./a33468b95d0b15b0@692.js";

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

Click on the region to change votes for each candidates. The region totals will be shown in the legend. The "tossup" row cannot be selected or edited. Click on a candidate to open the form for changing either vote totals or the vote percentage. Click the back button to exit this mode.

---
### Allocating multiple regions based on population size

Click on the candidate in the legend. This allows you to change the candidate percentage of regions based on size. The first two ranges set the smallest and largest region to change; the third sets the percentage. Click "Apply Range" to apply the changes to the map.

---
### Allocating multiple highlighted regions

Activate multiple region mode by click the bottom "Enable Multiregion Mode". This allows you to change the candidate percentage of multiple regions at once. Click the states that you want to edit, set the candidate and percentage, then click "Apply" to apply the changes. Click the back button to exit this mode.

---
### Switching between state and county maps

Use the buttons at the bottom left corner to switch between the county map and the state map

---
### Editing and deleting a candidate

To edit a candidate, click on the candidate in the legend. From there, you can change both the name of the candidate and the color that represents it. To delete the candidate, hover over the row with the candidate. Click the X button that appears on the right. The first two rows do notshow a delete button and cannot be deleted, but can be edited. The "tossup" row cannot be edited or deleted. 

---
### Adding a new candidate

To add a new candidate, press the bottom right plus button at the bottom of the legend. You may need to scroll down to the bottom for the button to show.

<br>
<br>
`
)});
  main.variable(observer("viewof vueElection")).define("viewof vueElection", ["html","electionTotals","createColor","d3","countyFeatures","stateFeatures","Vue","VL","VueControl","VueRegionElection","binaryInsert","binarySearchIndex","L","stateBorder"], function*(html,electionTotals,createColor,d3,countyFeatures,stateFeatures,Vue,VL,VueControl,VueRegionElection,binaryInsert,binarySearchIndex,L,stateBorder)
{
  
  const container = html`
      <div>
        <l-map style="height: 900px" :zoom="zoom" :center="center">
          <vue-control :mode="controlMode" v-on="controlListeners"></vue-control>
          <l-tile-layer :url="url" :attribution="attribution"></l-tile-layer>
          <vue-region-election v-for="election in elections" :key="election.name" :election="election.election" :visible="activeElectionInfo.name === election.name" :multimode="multimode" v-on="layerListeners"></vue-region-election>
          <l-geo-json :geojson="stateBorder" :options-style="borderStyle" :options="{ coordsToLatLng }"></l-geo-json>
        </l-map>
        <form>
          <div>Election Type</div>
          <template v-for="election in elections">
            <input :id="election.name" type="radio" name="electionType" :value="election.name" :checked="activeElectionInfo.name === election.name" @change="onChangeActiveElection"/>
            <label :for="election.name">{{ election.name.charAt(0).toUpperCase() + election.name.slice(1) }}</label>
          </template>
        </form>
      </div>`
  
  yield container
  
  const votes = electionTotals.filter(([code, _]) => code.length == 2).reduce((x, [_, votes]) => x + votes, 0)
  const makeElection = function(features, titleMaker) {

    const candidates = [
      { id: 1, name: "Hillary Clinton", color: createColor('#007dd6') },
      { id: 2, name: "Donald Trump", color: createColor('#b81800') },
      { id: 3, name: "Gary Johnson", color: createColor('#015520') },
      { id: 4, name: "Jill Stein", color: createColor('#ffb6c1') }
    ]
    
    const regions = features.map(function(feature) {
      const [_, votes] = electionTotals.find(([code, _]) => code === feature.id)

      return {
        ...feature,
        title: titleMaker(feature),
        election: {
          total: votes,
          winner: null,
          margin: 0,
          votes: candidates.map(({id}) => ({id, votes: 0}))
        }
      }
    })
    
    return {
      candidates,
      labeler: candidates.length + 1,
      election: {
        total: votes,
        winner: null,
        votes: candidates.map(({id}) => ({id, votes: 0}))
      },
      regions: regions.slice().sort((a, b) => d3.ascending(a.id, b.id)),
      sortedRegions: regions.slice().sort((a, b) => d3.descending(a.election.total, b.election.total)).map(({id}) => id)
    }
  }
  
  const elections = [
    { name: "county",
      election: makeElection(countyFeatures, function(county) {
       const {properties: {name: stateName}} = stateFeatures.find(({id}) => id === county.id.substring(0, 2))
       return `${county.properties.name}, ${stateName}`
     }) 
    },
    { name: "state", 
      election: makeElection(stateFeatures, state => state.properties.name) 
    }
  ]
  
  new Vue({
    components: { 
      LMap: VL.LMap, 
      LTileLayer: VL.LTileLayer,
      LGeoJson: VL.LGeoJson,
      VueControl,
      VueRegionElection
    },
    provide: function() {
      return { 
        coordsToLatLng: this.coordsToLatLng 
      }
    },
    data: {
      zoom: 5,
      center: [37.8, -96],
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 16,
      elections,
      activeElectionInfo: {
        name: 'county',
      },
      controlMode: {
        name: 'National',
        election: elections.find(x => x.name === 'county').election,
        region: null,
        candidateRowSettings: elections.find(x => x.name === 'county').election.candidates.map(({id}, i) => {
          return {
            id,
            focused: false,
            selected: false,
            deletable: i >= 2
          }
        })
      },
      multimode: {
        enabled: false,
        regions: []
      },
    },
    mounted() {
      this.$nextTick(function() {
        container.value = {
          stateElection: this.elections.find(({name}) => name === 'state').election,
          countyElection: this.elections.find(({name}) => name === 'county').election,
        }
      })
    },
    methods: {
      onAddMultimodeRegion(regionId) {
        binaryInsert(this.multimode.regions, regionId, (a, b) => d3.ascending(a, b))
      },
      onRemoveMultimodeRegion(regionId) {
        const index = binarySearchIndex(this.multimode.regions, regionId, (a, b) => d3.ascending(a, b))
        this.multimode.regions.splice(index, 1)
      },
      onCandidateChange({election, candidate}) {
        const index = election.candidates.findIndex(({id}) => id === candidate.id)
        Vue.set(election.candidates, index, candidate)
        container.dispatchEvent(new CustomEvent('input'))
      },
      onRegionChange({election, region, candidate, votes}) {
        this.changeVotes(election, region, candidate, votes)
        container.dispatchEvent(new CustomEvent('input'))
      },
      onOrderedRegionChange({election, candidate, range: {start, end, percentage}}) {
        for (let i = start-1; i < end; i++) {
          const regionId = election.sortedRegions[i]
          const regionIndex = binarySearchIndex(election.regions, regionId, (a, b) => d3.ascending(a.id, b))
          const region = election.regions[regionIndex]
          this.changePercentage(election, region, candidate, percentage)
        }
        container.dispatchEvent(new CustomEvent('input'))
      },
      onMultiRegionChange({election, candidate, percentage}) {
        for (const regionId of this.multimode.regions) {
          const regionIndex = binarySearchIndex(election.regions, regionId, (a, b) => d3.ascending(a.id, b))
          const region = election.regions[regionIndex]
          this.changePercentage(election, region, candidate, percentage)
        }
        container.dispatchEvent(new CustomEvent('input'))
      },
      onSingleRegionClick({election, region}) {
        this.controlMode.name = 'Single Region'
        this.controlMode.election = election
        
        const index = binarySearchIndex(election.regions, region, (a, b) => d3.ascending(a.id, b))
        this.controlMode.region = election.regions[index]
      },
      onChangeActiveElection(e) {
        const name = e.target.value
        this.activeElectionInfo.name = name
        
        this.multimode.enabled = false
        this.multimode.regions = []
        
        this.controlMode.name = 'National'
        this.controlMode.election = this.activeElection
        this.controlMode.region = null
        this.controlMode.candidateRowSettings = this.activeElection.candidates.map(({id}, i) => {
          return {
            id,
            focused: false,
            selected: false,
          }
        })
        
      },
      coordsToLatLng: function(coords) {
        return L.GeoJSON.coordsToLatLng(this.$_inversion(coords))
      },
      addCandidate(election) {
        const id = election.labeler++
        const candidate = { id, name: `Candidate ${id}`, color: createColor('#000') }
        election.candidates.push(candidate)
        election.election.votes.push({id, votes: 0})
        election.regions.forEach(region => region.election.votes.push({id, votes: 0}))
        this.controlMode.candidateRowSettings.push({ 
          id, 
          focused: false, 
          selected: false,
          deletable: true
        })
        container.dispatchEvent(new CustomEvent('input'))
      },
      deleteCandidate({election, candidate: {id: candidateId}}) {
        const candidateIndex = election.candidates.findIndex(({id}) => id === candidateId)
        
        election.candidates.splice(candidateIndex, 1)
        const nationalIndex = election.election.votes.findIndex(({id}) => id === candidateId)
        election.election.votes.splice(nationalIndex, 1)
        
        if (candidateId === election.election.winner) {
          const {winner} = this.$_findWinner(election.election)
          election.election.winner = winner
        }
        
        for (const region of election.regions) {
          const regionElection = region.election
          const index = regionElection.votes.findIndex(({id}) => id === candidateId)
          regionElection.votes.splice(index, 1)
          if (candidateId == regionElection.winner) {
            const {winner, margin} = this.$_findWinner(regionElection)
            regionElection.winner = winner, regionElection.margin = margin
          }
        }
        
        const settingsIndex = this.controlMode.candidateRowSettings.findIndex(({id}) => id === candidateId)
        this.controlMode.candidateRowSettings.splice(settingsIndex, 1)
        container.dispatchEvent(new CustomEvent('input'))
        
      },
      onCloseMode() {
        this.controlMode.name = "National"
        this.controlMode.region = null
        this.controlMode.candidateRowSettings.forEach((setting, i) => {
          setting.focused = false
          setting.selected = false
        })
        this.multimode.enabled = false
        this.multimode.regions = []
      },
      changeVotes(election, region, {id: candidateId}, votes) {
        
        const regionElection = region.election,
              nationalElection = election.election
        
        const regionCandidate = regionElection.votes.find(({id}) => id === candidateId)
        
        for (const candidate of nationalElection.votes) {
          candidate.votes -= regionElection.votes.find(({id}) => id === candidate.id).votes
        }
        
        const oldVotes = regionElection.votes.find(({id}) => id === candidateId).votes
        const allocatedVotes = regionElection.votes.reduce((val, {votes}) => val + votes, 0),
              availableVotes = regionElection.total - allocatedVotes
        
        regionCandidate.votes = votes
        
        if ((votes - oldVotes - availableVotes) > 0) {
          //subtract from other candidates to make up the difference 
          const totalWithoutCandidate = regionElection.total - votes
          let remainder = totalWithoutCandidate
          
          for (const candidate of regionElection.votes) {
            if (candidateId != candidate.id) {
              const restVotes = regionElection.total - oldVotes - availableVotes
              const newVotes = Math.floor(candidate.votes / restVotes * totalWithoutCandidate)
              candidate.votes = newVotes, remainder -= newVotes
            }
          }
          
          while (remainder > 0) {
           for (const candidate of regionElection.votes) {
             if (candidateId != candidate.id) {
               candidate.votes++, remainder--
               if (remainder <= 0) break;
             }
           }
          }
        }
        
        for (const candidate of nationalElection.votes) {
          candidate.votes += regionElection.votes.find(({id}) => id === candidate.id).votes
        }
        
        const {winner: regionWinner, margin} = this.$_findWinner(regionElection)
        regionElection.winner = regionWinner
        regionElection.margin = margin
        
        const {winner} = this.$_findWinner(nationalElection)
        nationalElection.winner = winner
      },
      changePercentage(election, region, candidate, percentage) {
        const votes = Math.ceil(percentage / 100 * region.election.total)
        this.changeVotes(election, region, candidate, votes)
      },
      onEnableMultiRegionMode() {
        this.controlMode.name = 'Multi Region'
        this.controlMode.region = null
        this.multimode.enabled = true
        this.controlMode.candidateRowSettings.forEach((settings, i) => {
          settings.focused = false
          settings.selected = false
        })
      },
      onChangeCandidateRowSettings({candidate: {id: candidateId}, settings: {focused, selected}}) {
        const settings = this.controlMode.candidateRowSettings.find(({id}) => id === candidateId)
        settings.focused = focused, settings.selected = selected
      },
      $_topTwo(election) {
        return election.votes.sort((a, b) => d3.descending(a.votes, b.votes)).slice(0, 2)
      },
      $_findWinner(election) {
        const [winner, second] = this.$_topTwo(election)
        return {
          winner: winner.votes > second.votes ? winner.id : null,
          margin: winner.votes - second.votes
        }
      },
      $_inversion: d3.geoAlbersUsa().scale(1300).translate([487.5, 305]).invert,
    },
    computed: {
      options() {
        return {
          coordsToLatLng: this.coordsToLatLng
        }
      },
      activeElection() {
        const activeName = this.activeElectionInfo.name
        return this.elections.find(({name}) => name === activeName).election
      },
      controlListeners() {
        return {
          'add-candidate': this.addCandidate,
          'remove-candidate': this.deleteCandidate,
          'close-mode': this.onCloseMode,
          'candidate-change': this.onCandidateChange,
          'ordered-region-change': this.onOrderedRegionChange,
          'single-region-change': this.onRegionChange,
          'multi-region-percentage-change': this.onMultiRegionChange,
          'enable-multi-region-mode': this.onEnableMultiRegionMode,
          'change-candidate-row-settings': this.onChangeCandidateRowSettings,
        }
      },
      layerListeners() {
        return {
          'add-region': this.onAddMultimodeRegion,
          'remove-region': this.onRemoveMultimodeRegion,
          'single-region-click': this.onSingleRegionClick,
        }
      },
      stateBorder: () => stateBorder,
      borderStyle() {
        return {
          color: 'white',
          fillColor: 'none',
          weight: 1,
        }
      },
      
    },
    el: container
  })
  
}
);
  main.variable(observer("vueElection")).define("vueElection", ["Generators", "viewof vueElection"], (G, _) => G.input(_));
  main.variable(observer("countyMapResults")).define("countyMapResults", ["md"], function(md){return(
md`# County Map Results

This is the county level result of using the map interface. Each circle represents a county. The larger the circle, the bigger the population of the county. The color represents the winner of the county, with the intensity of the color representing the margin of victory. The grayer the color, the closer the margin of victory

Hover over the circle for more information on the county. You can click on the 3 dots to the left when hovering over the map to download the map as a PNG or SVG. 

Inspiration for map shape and some of the code used to make said shape comes from [this ObservableHQ project](https://observablehq.com/@karimdouieb/try-to-impeach-this-challenge-accepted).`
)});
  main.variable(observer()).define(["vueElection","countyChartTemplate","binarySearch","d3","svg"], function(vueElection,countyChartTemplate,binarySearch,d3,svg)
{
  
  const election = vueElection.countyElection
  
  countyChartTemplate.countySelection
    .style('fill', d => {
      const region = binarySearch(election.regions, d.id, (a, b) => d3.ascending(a.id, b))
      const {winner, margin, total} = region.election
      const winnerCandidate =  winner ? election.candidates.find(({id}) => id === winner) : null
      return winnerCandidate ? winnerCandidate.color(Math.round(margin / total * 10000) / 100) : '#CDCDCD'
    })
  
  countyChartTemplate.titles.text(d => {
    const region = binarySearch(election.regions, d.id, (a, b) => d3.ascending(a.id, b))
    const {winner, margin, votes, total} = region.election
    const winnerCandidate = winner ? election.candidates.find(({id}) => id === winner) : null
    const winnerVotes = winner ? votes.find(({id}) => id === winner).votes : Math.max(...votes.map(({votes}) => votes))
    
    return `${region.title}
            Winner: ${winnerCandidate ? winnerCandidate.name : 'Tie' }
            Percentage: ${Math.round(winnerVotes / total * 10000) / 100}% 
            Margin: ${(margin).toLocaleString('en')}`
  })
  
  const tossupCandidate = {
    id: null,
    name: 'Tossup',
    color: 'none',
    total: election.election.total - election.election.votes.reduce((val, {votes}) => val + votes, 0)
  }
  
  const candidateRows = countyChartTemplate.candidates
    .selectAll("g")
    .data([...election.candidates.map(({id: candidateId, name, color}) => {
      return {
        name,
        color: color(100),
        total: election.election.votes.find(({id}) => candidateId === id).votes
      }
    }), tossupCandidate])
    .join(enter => {
      const rows = enter.append('g')
      rows.append(() => svg`<circle class="candidate-color" cx="15" cy="15" r="15"/>`)
      
      const candidateText = rows.append(() => svg`
        <text transform="translate(${30+15},15)">
          <tspan class="percentage" dx="5"></tspan>
          <tspan class="name" dx="20"></tspan>
          <tspan class="total" dx="25"></tspan>
        </text>
      `)
      
      return rows
    })
      .attr('transform', (_, i) => `translate(0,${i * 50})`)
     
  countyChartTemplate.svg.attr('viewBox', [0,0,975,700+50*candidateRows.size()+15])
  
  candidateRows.select(".candidate-color").style("fill", ({color}) => color)
  candidateRows.select(".percentage").text(d => `${Math.round(d.total/election.election.total * 10000) / 100}%`)
  candidateRows.select(".name").text(d => d.name)
  candidateRows.select(".total").text(d => d.total.toLocaleString('en'))

  
  return countyChartTemplate.svg.node()
  
}
);
  main.variable(observer()).define(["md"], function(md){return(
md`# State Map Results

This is the state level map result of using the map interface. The color scheme is the same as the county map. Just like the county map, you can hover over each region to learn more. See the [County Map Results](https://observablehq.com/d/8f2f18e7ddfa360f#countyMapResults) section to learn how to download the map as a SVG or PNG`
)});
  main.variable(observer()).define(["vueElection","stateChartTemplate","binarySearch","d3","svg"], function(vueElection,stateChartTemplate,binarySearch,d3,svg)
{
  
  const election = vueElection.stateElection

  stateChartTemplate.stateSelection
    .style('fill', d => {
      const region = binarySearch(election.regions, d.id, (a, b) => d3.ascending(a.id, b))
      const {winner, margin, total} = region.election
      const winnerCandidate =  winner ? election.candidates.find(({id}) => id === winner) : null
      return winnerCandidate ? winnerCandidate.color(Math.round(margin / total * 10000) / 100) : '#CDCDCD'
  })
  
  stateChartTemplate.titles.text(d => {
    const region = binarySearch(election.regions, d.id, (a, b) => d3.ascending(a.id, b))
    const {winner, margin, votes, total} = region.election
    const winnerCandidate = winner ? election.candidates.find(({id}) => id === winner) : null
    const winnerVotes = winner ? votes.find(({id}) => id === winner).votes : Math.max(...votes.map(({votes}) => votes))
    
    return `${region.title}
            Winner: ${winnerCandidate ? winnerCandidate.name : 'Tie' }
            Percentage: ${Math.round(winnerVotes / total * 10000) / 100}% 
            Margin: ${(margin).toLocaleString('en')}`
  })
  
  const tossupCandidate = {
    id: null,
    name: 'Tossup',
    color: 'none',
    total: election.election.total - election.election.votes.reduce((val, {votes}) => val + votes, 0)
  }
  
  const candidateRows = stateChartTemplate.candidates
    .selectAll("g")
    .data([...election.candidates.map(({id: candidateId, name, color}) => {
      return {
        name,
        color: color(100),
        total: election.election.votes.find(({id}) => candidateId === id).votes
      }
    }), tossupCandidate])
    .join(enter => {
      const rows = enter.append('g')
      rows.append(() => svg`<circle class="candidate-color" cx="15" cy="15" r="15"/>`)
      
      const candidateText = rows.append(() => svg`
        <text transform="translate(${30+15},15)">
          <tspan class="percentage" dx="5"></tspan>
          <tspan class="name" dx="20"></tspan>
          <tspan class="total" dx="25"></tspan>
        </text>
      `)
      
      return rows
    })
      .attr('transform', (_, i) => `translate(0,${i * 50})`)
     
  stateChartTemplate.svg.attr('viewBox', [0,0,975,700+50*candidateRows.size()+15])
  
  candidateRows.select(".candidate-color").style("fill", ({color}) => color)
  candidateRows.select(".percentage").text(d => `${Math.round(d.total/election.election.total * 10000) / 100}%`)
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
  main.variable(observer("stateChartTemplate")).define("stateChartTemplate", ["d3","stateFeatures","path","topojson","us"], function(d3,stateFeatures,path,topojson,us)
{
  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, 975, 900])
  
  const stateSelection = svg.append("g")
    .selectAll("path")
    .data(stateFeatures)
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
      padding: 6px 6px;
      font: 14px/16px Arial, Helvetica, sans-serif;
      background: white;
      background: rgba(255,255,255,0.8);
      box-shadow: 0 0 15px rgba(0,0,0,0.2);
      border-radius: 5px;
      display: auto;
      width: 135%;
      
    }

    .info h4 {
        margin: 10px 7px;
        padding: 4px 0;
        color: #777;
    }

    .close-button {
      cursor: pointer;
      color: 'silver';
      text-decoration: none;
      position: absolute; 
      font: 32px;
      top: 10px;
      left: 12px;
    }

    .legend {
      padding: 6px 8px;
      font: 14px/16px Arial, Helvetica, sans-serif;
      background: white;
      background: rgba(255,255,255,0.8);
      box-shadow: 0 0 15px rgba(0,0,0,0.2);
      border-radius: 3px;
    }

    .candidate-row.focused, .candidate-row.selected {
      background-color: #cdcdcd;
    }

    .delete-button {
      cursor: pointer;
      padding: 12px 6px;
    }

    .delete-button:hover {
      background: #aaa;
    }

  </style>
`
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
  main.variable(observer("radiusScale")).define("radiusScale", ["d3","electionTotals"], function(d3,electionTotals)
{
  const populationMax = d3.max(electionTotals, ([_, count]) => count)
  const maxRadius = 25
  
  return d3.scaleSqrt()
    .domain([0, populationMax])
    .range([1, maxRadius])
}
);
  main.variable(observer("VueRegionElection")).define("VueRegionElection", ["VL","d3","L","binarySearchIndex"], function(VL,d3,L,binarySearchIndex){return(
{
  components: { LGeoJson: VL.LGeoJson },
  inject: ["coordsToLatLng"],
  props: ['election', 'multimode', 'visible'],
  data: function() {
    return { 
      regionLayers: this.election.regions.map(({id}) => ({id, clicked: false, layer: null})).sort((a, b) => d3.ascending(a.id, b.id)),
      geojsonLayer: null,
      regions: this.election.regions.slice().map(({type, id, title, geometry}) => {
        return { type, id, title, geometry }
      }),
    }
  },
  mounted() {
    this.$nextTick(function() {
      this.geojsonLayer = this.$refs.geojsonLayer.mapObject
    })
  },
  methods: {
    $_highlightFeature(e) {
      const layer = e.target
      
      layer.setStyle({ weight: 2, color: '#666' })
      
      if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
      }
    },
    $_resetHighlight(e) {
      const layer = e.target
      this.geojsonLayer.resetStyle(layer)
    },
    $_findRegionLayer(featureId) {
      const index = binarySearchIndex(this.regionLayers, featureId, (a, b) => d3.ascending(a.id, b))
      return this.regionLayers[index]
    },
    setRegionClick(featureId, clicked) {
      const regionLayer = this.$_findRegionLayer(featureId)
      regionLayer.clicked = clicked
    },
    getRegionClick(featureId) {
      const {clicked} = this.$_findRegionLayer(featureId)
      return clicked
    },
    getLayer(featureId) {
      const {layer} = this.$_findRegionLayer(featureId)
      return layer
    },
    setLayer(featureId, layer) {
      const regionLayer = this.$_findRegionLayer(featureId)
      regionLayer.layer = layer
    },
    onAddLayer({id, title}, layer) {
      layer.bindTooltip(title)
      this.setLayer(id, layer)
    },
    onRemoveLayer({id}, layer) {
      layer.unbindTooltip()
      this.setRegionClick(id, false)
      this.setLayer(id, null)
    },
    onMouseoverLayer(e, {id}) {
      if (!this.getRegionClick(id)) {
        this.$_highlightFeature(e)
      }
    },
    onMouseoutLayer(e, {id}) {
      if (!this.getRegionClick(id)) {
        this.$_resetHighlight(e)
      }
    },
    onClickLayer(e, {id}) {
      let layerClicked = this.getRegionClick(id)
      this.setRegionClick(id, this.multimode.enabled && !layerClicked)
      layerClicked = this.getRegionClick(id)
      
      if (this.multimode.enabled && !layerClicked) {
        this.$_resetHighlight(e)
        this.$emit('remove-region', id)
      } else if (this.multimode.enabled && layerClicked) {
        this.$_highlightFeature(e)
        this.$emit('add-region', id)
      } else if (!this.multimode.enabled) {
        this.$emit('single-region-click', {election: this.election, region: id})
      }
    },
    
    onEachFeature(feature, layer) {
      const vlGeojson = this
      layer.on({
        mouseover: e => vlGeojson.onMouseoverLayer(e, feature),
        mouseout: e => vlGeojson.onMouseoutLayer(e, feature),
        click: e => vlGeojson.onClickLayer(e, feature),
        add: e => vlGeojson.onAddLayer(feature, layer),
        remove: e => vlGeojson.onRemoveLayer(feature, layer)
      })
    } 
  },
  watch: {
    winners: function(newWinners, oldWinners) {
      for (let i = 0; i < newWinners.length; i++) {
        const {id, winner: newWinner, margin: newMargin} = newWinners[i],
              {winner: oldWinner, margin: oldMargin} = oldWinners[i]
        
        if (newWinner != oldWinner || newMargin != oldMargin) {
          const layer = this.getLayer(id)
          this.geojsonLayer.resetStyle(layer)
        }
        
      }
    },
    candidates: function(newCandidates, oldCandidates) {
      for (const winner of this.winners) {
        const winnerId = winner.winner
        const newCandidate = newCandidates.find(({id}) => id === winnerId),
              oldCandidate = oldCandidates.find(({id}) => id === winnerId)
        
        if (oldCandidate && newCandidate.color != oldCandidate.color) {
          const layer = this.getLayer(winner.id)
          this.geojsonLayer.resetStyle(layer)
        }
      }
    },
    multimodeRegions: function(newRegions, oldRegions) {
      if (newRegions.length == 0) {
        for (const regionId of oldRegions) {
          const layerClicked = this.getRegionClick(regionId)
          if (layerClicked) {
            this.setRegionClick(regionId, false)
            const layer = this.getLayer(regionId)
            this.geojsonLayer.resetStyle(layer)
          }
        }
      }
    }
  },
  computed: {
    candidates() {
      return this.election.candidates
    },
    winners() {
      return this.election.regions.map(({id, election: {total, winner, margin}}) => {
        return { id, total, winner, margin }
      }).sort((a, b) => d3.ascending(a.id, b.id))
    },
    multimodeRegions() {
      return this.multimode.regions
    },
    options() {
      return { 
        coordsToLatLng: this.coordsToLatLng,
        onEachFeature: this.onEachFeature
      }
    },
    optionsStyle() {
      const vlGeojson = this
      return function(feature) {
        const index = binarySearchIndex(vlGeojson.winners, feature.id, (a, b) => d3.ascending(a.id, b))
        const {total, winner, margin} = vlGeojson.winners[index]
        const percentage = Math.round(margin / total * 10000) / 100
        const fillColor = winner ? vlGeojson.candidates.find(({id}) => id === winner).color(percentage) : '#CDCDCD'
        
        return {
          color: 'white',
          weight: 0.5,
          fillColor,
        }
      }
    }
  },
  template: `
    <l-geo-json ref="geojsonLayer" :geojson="regions" :options="options" :options-style="optionsStyle" :visible="visible"></l-geo-json>
  `
}
)});
  main.variable(observer("VueControl")).define("VueControl", ["VueControlMultiTable","VL"], function(VueControlMultiTable,VL){return(
{
  props: ['mode'],
  components: {
    multiTable: VueControlMultiTable,
    LControl: VL.LControl
  },
  computed: {
    listeners() {
      return {
        'candidate-change': this.onCandidateChange,
        'ordered-region-change': this.onOrderedRegionChange,
        'single-region-change': this.onSingleRegionChange,
        'multi-region-percentage-change': this.onMultiRegionChange,
        'remove-candidate': this.onRemoveCandidate,
        'change-candidate-row-settings': this.onChangeCandidateRowSettings
      }
    },
    closeable() {
      const name = this.mode.name
      return ['Single Region', 'Multi Region'].includes(name)
    },
    inNationMode() {
      return this.mode.name == 'National'
    }
  },
  methods: {
    onAddCandidate() {
      this.$emit('add-candidate', this.mode.election)
    },
    onCandidateChange(e) {
      this.$emit('candidate-change', e)
    },
    onOrderedRegionChange(e) {
      this.$emit('ordered-region-change', e)
    },
    onSingleRegionChange(e) {
      this.$emit('single-region-change', e)
    },
    onMultiRegionChange(e) {
      this.$emit('multi-region-percentage-change', e)
    },
    onClose() {
      this.$emit('close-mode')
    },
    onEnableMultimode() {
      this.$emit('enable-multi-region-mode')
    },
    onRemoveCandidate(e) {
      this.$emit('remove-candidate', e)
    },
    onChangeCandidateRowSettings(e) {
      this.$emit('change-candidate-row-settings', e)
    }
  },
  template: `
    <l-control position="bottomleft">
      <div class="info">
        <a v-if="closeable" class="close-button" @click="onClose">&larr;</a>
        <multi-table :mode="mode" v-on="listeners"></multi-table>
        <div style="overflow: hidden;">
          <button v-if="inNationMode" type="button" @click="onEnableMultimode">Enable Multiregion Mode</button>
          <button type="button" style="float: right; "@click="onAddCandidate">+</button>
        </div>
      </div>
    </l-control>
  `
}
)});
  main.variable(observer("VueControlMultiTable")).define("VueControlMultiTable", ["VueCandidateTable","VueCandidateForm","VueRegionForm","VueMultiRegionForm"], function(VueCandidateTable,VueCandidateForm,VueRegionForm,VueMultiRegionForm){return(
{
  components: { VueCandidateTable },
  props: ['mode'],
  data: function() {
    return {
      modes: [
        { name: 'National',
          title: () => 'National Vote Total',
          component: VueCandidateForm },
        { name: 'Single Region',
          title: () => this.mode.region.title,
          component: VueRegionForm },
        { name: 'Multi Region',
          title: () => 'National Vote Total (Multi Region Mode)',
          component: VueMultiRegionForm }
      ]
    }
  },
  computed: {
    currentMode() {
      const {name: modeName} = this.mode
      const currentMode = this.modes.find(({name}) => name === modeName)
      return currentMode
    },
    maxRegions() {
      return this.mode.election.regions.length
    },
    formListeners() {
      return {
        'ordered-region-change': this.onRegionRangeChange,
        'candidate-change': this.onCandidateChange,
        'multi-region-percentage-change': this.onMultiRegionPercentageChange,
        'single-region-change': this.onTotalChange,
      }
    },
    tableListeners() {
      return {
        'remove-candidate': this.onRemoveCandidate,
        'change-candidate-row-settings': this.onChangeCandidateRowSettings
      }
    },
    candidates() {
      return this.mode.election.candidates
    },
    electionInfo() {
      const election = this.currentMode.name == 'Single Region' ? this.mode.region : this.mode.election
      
      return {
        total: election.election.total,
        votes: election.election.votes
      }
    }
  },
  methods: {
    onRemoveCandidate(e) {
      this.$emit('remove-candidate', {election: this.mode.election, candidate: e})
    },
    onCandidateChange(e) {
      this.$emit('candidate-change', {election: this.mode.election, candidate: e})
    },
    onRegionRangeChange(e) {
      this.$emit('ordered-region-change', {...e, election: this.mode.election})
    },
    onTotalChange(e) {
      this.$emit('single-region-change', { ...e, election: this.mode.election, region: this.mode.region})
    },
    onMultiRegionPercentageChange(e) {
      this.$emit('multi-region-percentage-change', { ...e, election: this.mode.election})
    },
    onChangeCandidateRowSettings(e) {
      this.$emit('change-candidate-row-settings', e)
    }
  },
  template: `
    <vue-candidate-table v-slot="{ candidate }" :candidates="candidates" :total="electionInfo.total" :title="currentMode.title()" :votes="electionInfo.votes" :candidate-row-settings="mode.candidateRowSettings" v-on="tableListeners">
      <component :is="currentMode.component" :params="{...mode, candidate}" v-on="formListeners"></component>
    </vue-candidate-table>
  `
}
)});
  main.variable(observer("VueCandidateTable")).define("VueCandidateTable", ["VueCandidateRow"], function(VueCandidateRow){return(
{
  components: { VueCandidateRow },
  props: ["candidates", "votes", "total", "title", "candidateRowSettings"],
  computed: {
    listeners() {
      return {
        'remove-candidate': e => this.$emit('remove-candidate', e),
        'change-candidate-row-settings': e => this.$emit('change-candidate-row-settings', e)
      }
    },
    tossupVotes: function () {
      return this.total - this.votes.reduce((t, c) => t + c.votes, 0)
    },
    tossupCandidate() {
      return {
        id: null,
        name: 'Tossup',
        color: (_percentage) => 'none'
      }
    },
    tossupSettings() {
      return {
        selected: false,
        focused: false,
        deletable: false,
      }
    },
  },
  methods: {
    getVotes(candidate) {
      return this.votes.find(({id}) => id === candidate.id).votes
    },
    onChangeCandidateRowSettings(e) {
      this.$emit('change-candidate-row-settings', e)
    },
    getCandidateSettings(candidate) {
      return this.candidateRowSettings.find(({id}) => id === candidate.id)
    },
    onRemoveCandidate(e) {
      this.$emit('remove-candidate', e)
    }
  },
  template: `
    <div style="overflow-y: auto;">
      <div style="text-align: center; padding: 4px 8px">{{ title }}</div>
      <table>
        <tr>
          <th></th>
          <th>Name</th>
          <th>Votes</th>
          <th>Percentage</th>
          <th></th>
        </tr>
        <tbody is="vue-candidate-row" v-for="(candidate, index) in candidates" :key="candidate.id" :candidate="candidate" :total="total" :votes="getVotes(candidate)" :settings="getCandidateSettings(candidate)" v-on="listeners">
          <tr><td colspan="4"><slot :candidate="candidate"></slot></td></tr>
        </tbody>
        <tbody is="vue-candidate-row" :candidate="tossupCandidate" :total="total" :votes="tossupVotes" :settings="tossupSettings"></tbody>
      </table>
    </div>
  `

}
)});
  main.variable(observer("VueCandidateRow")).define("VueCandidateRow", function(){return(
{
  props: ["candidate", "votes", "total", "settings"],
  methods: {
    onEnter: function () {
      this.$emit('change-candidate-row-settings', {
        candidate: this.candidate, 
        settings: {...this.settings, focused: true} 
      })
    },
    onLeave: function() {
      this.$emit('change-candidate-row-settings', {
        candidate: this.candidate, 
        settings: {...this.settings, focused: false} 
      })
    },
    onClick: function() {
      const currentSelected = this.settings.selected
      this.$emit('change-candidate-row-settings', {
        candidate: this.candidate, 
        settings: {...this.settings, selected: !currentSelected} 
      })
    },
    onRemoveCandidate() {
      this.$emit('remove-candidate', this.candidate)
    }
  },
  computed: {
    percentage: function() {
      return Math.round(this.votes / this.total * 10000) / 100;
    },
    listeners() {
      return {
        click: this.onClick,
        mouseenter: this.onEnter,
        mouseleave: this.onLeave
      }
    }
  },
  template: `
    <tbody>
      <tr :class="[{ focused: settings.focused, selected: settings.selected }, 'candidate-row']" v-on="listeners" style="padding: 5px 5px;">
        <td style="width: 25%">
            <svg viewBox="0 0 100 30">
              <circle transform="translate(15,17)" r="12" :style="{fill: candidate.color(100)}"></circle>
            </svg>
        </td>
        <td>{{ candidate.name }}</td>
        <td>{{ this.votes.toLocaleString('en') }}</td>
        <td>{{ percentage }}%</td>
        <td><span v-if="settings.deletable && (settings.focused || settings.selected)" class="delete-button" @click.stop="onRemoveCandidate">X</span></td>
    </tr>
    <slot v-if="settings.selected"></slot>
  </tbody>
  `
}
)});
  main.variable(observer("VueCandidateForm")).define("VueCandidateForm", ["VueRangeNumber","VueSliderRange","createColor"], function(VueRangeNumber,VueSliderRange,createColor){return(
{
  components: {
    VueRangeNumber, VueSliderRange
  },
  props: ["params"],
  data: function() {
    return {
      start: 1,
      end: this.params.election.regions.length,
      percentage: 50
    }
  },
  computed: {
    candidate() {
      return this.params.candidate
    },
    max() {
      return this.params.election.regions.length
    }
  },
  methods: {
    onNameChange: function(e) {
      this.$emit('candidate-change', {...this.candidate, name: e.target.value})
    },
    onColorChange: function(e) {
      const color = e.target.value
      this.$emit('candidate-change', {
        ...this.candidate, 
        color: createColor(color),
      })
    },
    onSliderChange: function([start, end]) {
      this.start = start, this.end = end
    },
    onPercentageChange: function(percentage) {
      this.percentage = percentage
    },
    onApplyChange: function() {
      this.$emit('ordered-region-change', {
        candidate: this.candidate,
        range: {
          start: this.start, 
          end: this.end, 
          percentage: this.percentage 
        }
      })
    }
  },
  template: `
    <form style="width: 100%;">
      <div>Candidate Info</div>
      <input type="text" :value="candidate.name" placeholder="Enter candidate here..." @input="onNameChange" style="outline: none;"/>
      <input type="color" :value="candidate.color(100)" @input="onColorChange" /><br>
      <div>Edit Regions From Largest to Smallest</div>
      <vue-slider-range :container="{min: 1, max, step: 1}" :left="start" :right="end" @change="onSliderChange">
      </vue-slider-range>
      <vue-range-number :container="{min: 0, max: 100, step: 0.01}" v-model="percentage"></vue-range-number>
      <input type="button" @click="onApplyChange" value="Apply" />
    </form>
  `
}
)});
  main.variable(observer("VueRegionForm")).define("VueRegionForm", ["VueRangeNumber"], function(VueRangeNumber){return(
{
  components: { VueRangeNumber },
  props: ["params"],
  computed: {
    candidateId() {
      return this.params.candidate.id
    },
    region() {
      return this.params.region
    },
    votes() { 
      return this.region.election.votes.find(({id}) => id === this.candidateId).votes
    },
    total() {
      return this.region.election.total
    },
    maxVotes() {      
      const votes = this.region.election.votes
      const tossup = this.total - votes.reduce((val, {votes}) => val + votes, 0)
      return this.votes + tossup
    },
    maxPercentage() {
      return Math.round(this.maxVotes / this.total * 10000) / 100
    },
    percentage: function() {
      return Math.round(this.votes / this.total * 10000) / 100
    }
  },
  methods: {
    onTotalChange: function(e) {
      this.$emit('single-region-change', {candidate: this.params.candidate, votes: e})
    },
    onPercentageChange: function(e) {
      this.$emit('single-region-change', {candidate: this.params.candidate, votes: Math.ceil(e * this.total / 100)})
    }
  },
  template: `
    <form>
      <div>Number of Votes</div>
      <vue-range-number :container="{min: 0, max: maxVotes, step: 1}" :value="votes" @change="onTotalChange">
      </vue-range-number>
      <div>Vote Percentage</div>
      <vue-range-number :container="{min: 0, max: maxPercentage, step: 0.01}" :value="percentage" @change="onPercentageChange">
      </vue-range-number>
    </form>
    `
}
)});
  main.variable(observer("VueMultiRegionForm")).define("VueMultiRegionForm", ["VueRangeNumber"], function(VueRangeNumber){return(
{
  components: { VueRangeNumber },
  props: ["params"],
  data: function() {
    return { percentage: 50 }
  },
  methods: {
    applyPercentageChange() {
      this.$emit('multi-region-percentage-change', {candidate: this.params.candidate, percentage: this.percentage})
    }
  },
  template: `
    <form>
      <div>Vote Percentage</div>
      <vue-range-number :container="{ min: 0, max: 100, step: 0.01}" v-model="percentage"></vue-range-number>
      <input type="button" @click="applyPercentageChange" value="Apply"/>
    </form>
  `
}
)});
  main.variable(observer("VueSliderRange")).define("VueSliderRange", ["VueNumber","VueDoubleRange"], function(VueNumber,VueDoubleRange)
{
  
  return {
    components: { VueNumber, VueDoubleRange },
    props: ["container", "left", "right"],
    methods: {
      onNumberChange: function(e, name) {
        if (name == 'left') {
          this.$emit('change', [e, this.right])
        } else if (name == 'right') {
          this.$emit('change', [this.left, e])
        }
      },
      onSliderChange: function(e) {
        this.$emit('change', e)
      },
    },
    template: `
      <div>
        <vue-number :container="{...container, name: 'left', max: right}" :value="left" @change="onNumberChange($event, 'left')"></vue-number>
        <vue-double-range @slider-change="onSliderChange" :slider="container" :left="left" :right="right"></vue-double-range>
        <vue-number :container="{...container, name: 'right', min: left }" :value="right" @change="onNumberChange($event, 'right')"></vue-number>
      </div>
      `
  }
  
}
);
  main.variable(observer("VueDoubleRange")).define("VueDoubleRange", ["rangeSlider"], function(rangeSlider){return(
{
    props: ["slider", "left", "right"],
    mounted() {
      this.$nextTick(function() {
        const {min, max, step} = this.slider
        this.$el.appendChild(this.makeSlider())
      })
    },
    methods: {
      makeSlider: function() {
        const {min, max, step} = this.slider
        return rangeSlider({ min, max, step, value: [this.left, this.right], display: (_v) => "" })
      },
      onSliderChange: function(e) {
        this.$emit('slider-change', e.target.value)
      }
    },
    updated() {
      this.$nextTick(function() {
        const [sliderLeft, sliderRight] = this.$el.firstChild.value
        if (sliderLeft != this.left || sliderRight != this.right) {
          this.$el.replaceChild(this.makeSlider(), this.$el.firstChild)
        }
      })
    },
    template: `<div @input="onSliderChange" :value="[left, right]" style="display: inline-block"></div>`
}
)});
  main.variable(observer("VueRangeNumber")).define("VueRangeNumber", ["VueSingleRange","VueNumber"], function(VueSingleRange,VueNumber){return(
{
    components: { VueSingleRange, VueNumber },
    model: {
      prop: 'value', event: 'change'
    },
    props: ['container', 'value'],
    methods: {
      onChange: function(e) {
        this.$emit('change', e)
      }
    },
    template: `
      <div>
        <vue-single-range :container="container" :value="value" @input="onChange"></vue-single-range>
        <vue-number :container="container" :value="value" @change="onChange"></vue-number>
      </div>`
 }
)});
  main.variable(observer("VueSingleRange")).define("VueSingleRange", function(){return(
{
  props: ['container', 'value'],
  methods: {
    onInput: function(e) {
      this.$emit('input', parseInt(e.target.value))
    }
  },
  template: `<input type="range" :name="container.name" :min="container.min" :max="container.max" :step="container.step" :defaultValue="container.min" :value="value" @input="onInput" style="display: inline-block"/>`
}
)});
  main.variable(observer("VueNumber")).define("VueNumber", function(){return(
{
  props: ['container', 'value'],
  methods: {
    onChangeNumber: function(e) {
      let value = parseInt(e.target.value)
      if (value > this.container.max) {
        value = this.container.max
      } else if (value < this.container.min) {
        value = this.container.min
      }
      
      this.$emit("change", value)
    }
  },
  template: `<input type="number" :name="container.name" :min="container.min" :max="container.max" :step="container.step" :defaultValue="container.min" :value="value" @change="onChangeNumber" style="width: auto; display: inline-block"/>`
}
)});
  main.variable(observer("electionTotals")).define("electionTotals", ["d3"], async function(d3){return(
await
d3.csv("https://gist.githubusercontent.com/ZavierHenry/a3035f06be9b1461daf74ce2032aa362/raw/ca78ec931708fb3db804e38e259631cd144fafaf/election_count.csv", ({code, count}) => [code,+count])
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
  main.variable(observer("color")).define("color", ["d3"], function(d3){return(
d3.scaleQuantize([1, 10], d3.schemeOranges[9])
)});
  main.variable(observer("path")).define("path", ["d3"], function(d3){return(
d3.geoPath()
)});
  main.variable(observer("binarySearchIndex")).define("binarySearchIndex", function(){return(
function binarySearchIndex(arr, target, cmpFunction) {
  let start = 0, end = arr.length - 1
  
  while (start <= end) {
    let mid = Math.floor((start + end) / 2)
    let cmp = cmpFunction(arr[mid], target)
    
    if (cmp == 0) {
      return mid
    } else if (cmp < 0) {
      start = mid + 1
    } else {
      end = mid - 1
    }
  }
  
  return -1
  
}
)});
  main.variable(observer("binarySearch")).define("binarySearch", ["binarySearchIndex"], function(binarySearchIndex){return(
function binarySearch(arr, target, cmpFunction) {
  const index = binarySearchIndex(arr, target, cmpFunction)
  return (index >= 0) ? arr[index] : null
}
)});
  main.variable(observer("binaryInsert")).define("binaryInsert", function(){return(
function binaryInsert(arr, target, cmpFunction) {
  
  if (arr.length == 0) {
    arr.push(target)
    return;
  }
  
  let start = 0, end = arr.length - 1
  
  while (start < end) {
    let mid = Math.floor((start + end) / 2)
    let cmp = cmpFunction(arr[mid], target)

    if (cmp == 0) {
      arr.splice(mid+1, 0, target)
    } else if (cmp < 0) {
      start = mid + 1
    } else {
      end = mid - 1
    }
    
  }
  
  arr.splice(cmpFunction(arr[start], target) < 0 ? start + 1 : start, 0, target)
 
  
}
)});
  main.variable(observer("stateFeatures")).define("stateFeatures", ["topojson","us"], function(topojson,us){return(
topojson.feature(us, us.objects.states).features
)});
  main.variable(observer("countyFeatures")).define("countyFeatures", ["topojson","us"], function(topojson,us){return(
topojson.feature(us, us.objects.counties).features
)});
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
  main.variable(observer("stateBorder")).define("stateBorder", ["topojson","us"], function(topojson,us){return(
topojson.mesh(us, us.objects.states, (a, b) => a !== b)
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
  main.variable(observer("VL")).define("VL", ["require"], function(require){return(
require("vue2-leaflet")
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
  main.variable(observer("Vue")).define("Vue", ["require"], function(require){return(
require('vue')
)});
  const child1 = runtime.module(define1);
  main.import("rangeSlider", child1);
  const child2 = runtime.module(define2);
  main.import("form", child2);
  const child3 = runtime.module(define3);
  main.import("legend", child3);
  return main;
}
