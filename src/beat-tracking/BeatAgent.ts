import BeatAgentGroup from './BeatAgentGroup'
import { Seconds } from '../global';

/**
 * Agent is the central class for beat tracking
 * @class
 */
class BeatAgent {
  expiryTime: Seconds;
  toleranceWndInner: Seconds;
  toleranceWndPre: any;
  toleranceWndPost: any;
  correctionFactor: any;
  maxChange: any;
  penaltyFactor: any;
  beatInterval: Seconds;
  initialBeatInterval: Seconds;
  beatTime: Seconds;
  totalBeatCount: number;
  events: number[];
  score: number;
  groupRef: any;
    /**
     * Constructor
     * @param {Number} tempo - tempo hypothesis of the Agent
     * @param {Number} firstBeatTime - the time of the first beat accepted by this Agent
     * @param {Number} firsteventScore - salience value of the first beat accepted by this Agent
     * @param {Array} group - reference to the agent group
     * @param {Object} [params={}] - parameters
     * @param {Number} [params.expiryTime=10] - the time after which an Agent that has not accepted any beat will be destroyed
     * @param {Number} [params.toleranceWndInner=0.04] - the maximum time that a beat can deviate from the predicted beat time without a fork occurring
     * @param {Number} [params.toleranceWndPre=0.15] - the maximum amount by which a beat can be earlier than the predicted beat time, expressed as a fraction of the beat period
     * @param {Number} [params.toleranceWndPost=0.3] - the maximum amount by which a beat can be later than the predicted beat time, expressed as a fraction of the beat period
     * @param {Number} [params.correctionFactor=50] - correction factor for updating beat period
     * @param {Number} [params.maxChange=0.2] - the maximum allowed deviation from the initial tempo, expressed as a fraction of the initial beat period
     * @param {Number} [params.penaltyFactor=0.5] - factor for correcting score, if onset do not coincide precisely with predicted beat time
     */
    constructor(
      tempo: Seconds, 
      firstBeatTime: Seconds, 
      firsteventScore: number, 
      group: BeatAgentGroup, 
      {
        expiryTime = 10,
        toleranceWndInner = 0.04,
        toleranceWndPre = 0.15,
        toleranceWndPost = 0.3,
        correctionFactor = 50,
        maxChange = 0.2,
        penaltyFactor = 0.5,
      } = {}
    ) {
        /**
         * the time after which an Agent that has not accepted any beat will be destroyed
         * @type {Number}
         */
        this.expiryTime = expiryTime;
        /**
         * the maximum time that a beat can deviate from the predicted beat time without a fork occurring
         * @type {Number}
         */
        this.toleranceWndInner = toleranceWndInner;
        /**
         * the maximum amount by which a beat can be earlier than the predicted beat time, expressed as a fraction of the beat period
         * @type {Number}
         */
        this.toleranceWndPre = toleranceWndPre;
        /**
         * the maximum amount by which a beat can be later than the predicted beat time, expressed as a fraction of the beat period
         * @type {Number}
         */
        this.toleranceWndPost = toleranceWndPost;

        this.toleranceWndPre *= tempo;
        this.toleranceWndPost *= tempo;

        /**
         * correction factor for updating beat period
         * @type {Number}
         */
        this.correctionFactor = correctionFactor;
        /**
         * the maximum allowed deviation from the initial tempo, expressed as a fraction of the initial beat period
         * @type {Number}
         */
        this.maxChange = maxChange;
        /**
         * factor for correcting score, if onset do not coincide precisely with predicted beat time
         * @type {Number}
         */
        this.penaltyFactor = penaltyFactor;

        /**
         * the current tempo hypothesis of the Agent, expressed as the beat period
         * @type {Number}
         */
        this.beatInterval = tempo;
        /**
         * the initial tempo hypothesis of the Agent, expressed as the beat period
         * @type {Number}
         */
        this.initialBeatInterval = tempo;
        /**
         * the time of the most recent beat accepted by this Agent
         * @type {Number}
         */
        this.beatTime = firstBeatTime;
        /**
         * the number of beats found by this Agent, including interpolated beats
         * @type {Number}
         */
        this.totalBeatCount = 1;
        /**
         * the array of onsets accepted by this Agent as beats, plus interpolated beats
         * @type {Array}
         */
        this.events = [firstBeatTime];
        /**
         * sum of salience values of the onsets which have been interpreted as beats by this Agent
         * @type {Number}
         */
        this.score = firsteventScore;
        /**
         * reference to agent group to which this agent belongs
         * @type {Array}
         */
        this.groupRef = group;
    }


    /**
     * The event time is tested to see if it is a beat time
     * @param {Number} eventTime - the event time to be tested
     * @param {Number} eventScore - salience values of the event time
     * @return {Boolean} indicate whether the given event time was accepted as a beat time
     */
    considerEvent(eventTime:Seconds, eventScore:number) {
      // Exit early and cancel self if event is beyond expiry time.
      if (eventTime - this.events[this.events.length - 1] > this.expiryTime) {
          this.score = -1;
          return false;
      }

      // Calculate no. of beats and error margin between new beat and last beat.
      let beatCount = Math.round( (eventTime - this.beatTime) / this.beatInterval );
      let err = eventTime - this.beatTime - beatCount * this.beatInterval;

      // If error margin is within the window of tolerance, accept the event.
      if (
        beatCount > 0
        && err >= -this.toleranceWndPre
        && err <= this.toleranceWndPost
      ) {
        // If error margin is outside the inner window, clone thyself.
        if(Math.abs(err) > this.toleranceWndInner)
          this.groupRef.agents.push(this.clone());
          // ^ This line seems dangerous to me, what if the new version gets called for the same event?? There would be a stack overflow

        // Call acceptEvent and exit.
        this.acceptEvent(eventTime, eventScore, err, beatCount);
        return true;
      }

      // Otherwise, return unsuccesful.
      return false;
    }


    /**
     * Accept the event time as a beat time, and update the state of the Agent accordingly
     * @param {Number} eventTime - the event time to be accepted
     * @param {Number} eventScore - salience values of the event time
     * @param {Number} err - the difference between the predicted and actual beat times
     * @param {Number} beatCount - the number of beats since the last beat
     */
    acceptEvent(eventTime:Seconds, eventScore:number, err:number, beatCount:number) {
      // Update current beat time.
      this.beatTime = eventTime;

      // Append new beat time to event list.
      this.events.push(eventTime);

      // Adjust the beat interval if within max range.
      let corrErr = err / this.correctionFactor;
      let newBeatInterval = this.beatInterval + corrErr
      let difFromInitial = Math.abs(this.initialBeatInterval - newBeatInterval)
      if (difFromInitial < this.maxChange * this.initialBeatInterval)
        this.beatInterval += corrErr;

      // Increment score and beat count.
      this.totalBeatCount += beatCount;
      let errFactor
      if(err > 0)
        errFactor = err / this.toleranceWndPost
      else
        errFactor = err / -this.toleranceWndPre
      let scoreFactor = 1 - this.penaltyFactor * errFactor;
      this.score += eventScore * scoreFactor;
    }

    /**
     * Interpolates missing beats in the Agent's beat track.
     * (Call once at end)
     */
    fillBeats() {
      // initialise
      let prevBeat, nextBeat, currentInterval, beats;
      prevBeat = this.events.length > 2 ? this.events[0] : 0;

      // For every event
      for (let i = 0; i < this.events.length; i++) {
        nextBeat = this.events[i];
        beats = Math.round((nextBeat - prevBeat) / this.beatInterval - 0.01);
        currentInterval = (nextBeat - prevBeat) / beats;
        let k = 0;
        for ( ; beats > 1; beats--) {
          prevBeat += currentInterval;
          this.events.splice(i + k, 0, prevBeat);
          k++;
        }
        prevBeat = nextBeat;
      }
    }


    /**
     * Makes a clone of the Agent
     * @return {Agent} agent's clone
     */
    clone() {
        // @ts-ignore
        let newAgent = new BeatAgent();
        newAgent.beatInterval = this.beatInterval;
        newAgent.initialBeatInterval = this.initialBeatInterval;
        newAgent.beatTime = this.beatTime;
        newAgent.totalBeatCount = this.totalBeatCount;
        newAgent.events = this.events.slice();
        newAgent.expiryTime = this.expiryTime;
        newAgent.toleranceWndInner = this.toleranceWndInner;
        newAgent.toleranceWndPre = this.toleranceWndPre;
        newAgent.toleranceWndPost = this.toleranceWndPost;
        newAgent.correctionFactor = this.correctionFactor;
        newAgent.maxChange = this.maxChange;
        newAgent.penaltyFactor = this.penaltyFactor;
        newAgent.score = this.score;
        newAgent.groupRef = this.groupRef;

        return newAgent;
    }

    get bpm() {
      return 60 / this.beatInterval
    }
}
export default BeatAgent
