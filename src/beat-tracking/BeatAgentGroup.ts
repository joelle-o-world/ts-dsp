import BeatAgent from './BeatAgent'

/**
 * Beat tracking class for processing onset data based on a set of tempo hypotheses.
 */
class BeatAgentGroup {
  initPeriod: number;
  thresholdBT: number;
  thresholdBI: number;
  tempoList: any;
  agents: BeatAgent[];
  agentParams: any;
  constructor(tempoList: Seconds[], {
    initPeriod = 5,
    thresholdBI = 0.02,
    thresholdBT = 0.04,
  }={}) {
    // Set parameters,
    this.initPeriod = initPeriod
    this.thresholdBI = thresholdBI
    this.thresholdBT = thresholdBT

    this.tempoList = tempoList

    this.agents = []
  }

  /** Add a new agent to the group. */
  addAgent(beatInterval:Seconds, initialTime:Seconds, initialScore:number) {
    this.agents.push(new BeatAgent(
      beatInterval,
      initialTime,
      initialScore,
      this,
      this.agentParams,
    ))
  }

  /** Remove duplicate agents keeping the one with the higher score.  */
  removeSimilarAgents() {
    // Sort agents by beat interval (asc.)
    this.agents.sort((a1, a2) => a1.beatInterval - a2.beatInterval)

    // For every agent
    for(let i=0; i<this.agents.length; i++) {

      let agentI = this.agents[i]

      // Skip if negative score
      if(this.agents[i].score < 0)
        continue

      // Otherwise, for every unique agent pair with similar intervals,
      for(let j=i+1; j<this.agents.length; j++) {
        let agentJ = this.agents[j]
        if(agentJ.beatInterval - agentI.beatInterval > this.thresholdBI)
          break

        // skip if too far our of phase
        if(Math.abs(agentJ.beatTime - agentI.beatTime) > this.thresholdBT)
          continue

        // Otherwise, assign negative score to agent with the lowest score
        if(agentI.score < agentJ.score)
          agentI.score = -1 // ie' Mark to be removed.
        else
          agentJ.score = -1 // ie' Mark to be removed.
      }
    }

    // Remove agents with negative scores
    this.agents = this.agents.filter(a => a.score >= 0)
  }

  /**
   * Consider a single event
   * @param time seconds
   * @param intensity 
   */
  considerEvent(time: number, intensity: number) {
    if(time < this.initPeriod) {
      // EVENT IS WITHIN THE INITIALISATION PERIOD:

      // If this is the very first event,
      if(this.agents.length == 0) {
        // Add an agent for each tempo hypothesis starting at the first event.
        for(let i=0; i<this.tempoList.length; i++)
          this.addAgent(this.tempoList[i], time, intensity)

        // Exit early.
        return
      }

      let prevBeatInterval = -1
      let isEventAccepted = true

      // For every (already existing) agent
      const nAgents = this.agents.length
      for(let k=0; k < nAgents; k++) {
        // If agent k has a different interval to agent k-1
        if(this.agents[k].beatInterval != prevBeatInterval) {
          // AT BEGINNING OF NEW COMMON BEAT INTERVAL GROUP:
          // If event was not accepted by previous group, add a new agent.
          if(!isEventAccepted)
            this.addAgent(prevBeatInterval, time, intensity)

          prevBeatInterval = this.agents[k].beatInterval
          isEventAccepted = false
        }

        isEventAccepted = this.agents[k].considerEvent(time,intensity) || isEventAccepted
      }

      this.removeSimilarAgents()

    } else {
      // Get each (pre-existing) agent to consider the event
      const length = this.agents.length
      for(let j=0; j<length; j++)
        this.agents[j].considerEvent(time, intensity)

      this.removeSimilarAgents()
    }
  }

  /** Find the agent with the best score. */
  get winningAgent() {
    let winner = this.agents[0]
    for(let agent of this.agents)
      if(agent.score > winner.score)
        winner = agent
    return winner
  }
}
export default BeatAgentGroup
