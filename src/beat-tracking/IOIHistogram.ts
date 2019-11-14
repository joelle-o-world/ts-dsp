import { Seconds } from "../global";

type IOICluster = {
  ioi: Seconds,
  size: number
  score?: number
}

/**
 * An object which collects an histogram of inter onset interval (ioi) clusters
 * based on series of time points.
 */
class IOIHistogram {
  widthThreshold: Seconds;
  maxIOI: Seconds;
  minIOI: Seconds;
  maxTempi: number;
  mergeOnTheFly: boolean;
  minBeatInterval: Seconds;
  maxBeatInterval: Seconds;
  i: number;
  buffer: Seconds[];
  clusters: IOICluster[];

  constructor({
    widthThreshold = 0.025, // 25ms
    maxIOI = 2.5, // seconds
    minIOI = 0.07, // seconds
    mergeOnTheFly = true,
    maxTempi = 10,
    minBeatInterval = 0.3, // 200bpm
    maxBeatInterval = 1, // 60bpm
  }={}) {
    this.widthThreshold = widthThreshold
    this.maxIOI = maxIOI
    this.minIOI = minIOI
    this.maxTempi = maxTempi
    this.mergeOnTheFly = mergeOnTheFly
    this.minBeatInterval = minBeatInterval
    this.maxBeatInterval = maxBeatInterval

    this.i = 0 // place within buffer
    this.buffer = []
    this.clusters = []
  }

  /** Pass peak data to the IOI histogram */
  data(t: Seconds | Seconds[]) { // Add data points one by one or as an array.
    if(typeof t != 'number') {
      for(let i in t)
        this.data(t[i])
      return this
    }

    while(t - this.buffer[0] > this.maxIOI)
      this.processForward()

    this.buffer.push(t)

    return this
  }

  /** Flush the buffer at the end of passing peak data to the histogram.  */
  flush() {
    while(this.buffer.length)
      this.processForward()
    return this
  }

  /** Process (and remove) the first data point in the buffer. */
  private processForward() {
    let t = this.buffer.shift()
    if(t == undefined)
      return

    for(let i=0; i<this.buffer.length; i++) {
      let v = this.buffer[i]
      let ioi = v-t

      if(ioi < this.minIOI)
        continue
      if(ioi > this.maxIOI){
        console.warn('something has gone wrong!')
        break
      }


      let k = 0
      for( ; k < this.clusters.length; k++) {
        let cluster = this.clusters[k]
        let dif = Math.abs(cluster.ioi - ioi)
        //  ^ abs difference between ioi and cluster k's ioi

        // If IOI is within the tolerance of cluster k.
        if(dif < this.widthThreshold) {
          // Skip one ahead if next cluster is a better match.
          if(k < this.clusters.length - 1) {
            let dif2 = Math.abs(this.clusters[k+1].ioi - ioi)
            if(dif2 < dif) { // - perhaps should re-implement with while loop?
              k++
              cluster = this.clusters[k]
            }
          }

          // Calculate new mean interval and size for cluster
          cluster.ioi = (cluster.ioi * cluster.size + ioi) / (cluster.size + 1)
          cluster.size++

          if(this.mergeOnTheFly)
            this.mergeAdjacent(k)

          break
        }
      }

      if(k != this.clusters.length)
        // IOI fits within an existing cluster
        continue

      // Otherwise create a new cluster
      let cluster = {
        ioi: ioi,
        size: 1,
      }
      let insertIndex = this.clusters.findIndex(c => c.ioi > cluster.ioi)
      if(insertIndex == -1)
        insertIndex = this.clusters.length

      this.clusters.splice(insertIndex, 0, cluster)

    }
  }

  /** Merge all similar clusters. */
  mergeClusters() {
    for(let i=1; i<this.clusters.length; i+=2)
      i = this.mergeAdjacent(i)
  }

  /**
   * Recursizely merges adjacent clusters to the given index if they are within the widthThreshold.
   * Returns the new index of the index argument
   */
  mergeAdjacent(i:number):number {
    if(i == null)
      throw 'mergeAdjacent expects an integer.'

    let ioi1 = i > 0 ? this.clusters[i-1].ioi : null,
        ioi2 = this.clusters[i].ioi,
        ioi3 = i+1 < this.clusters.length ? this.clusters[i+1].ioi : null

    let dif1 = ioi1 ? ioi2-ioi1 : null
    let dif2 = ioi3 ? ioi3-ioi2 : null

    if(ioi1 && dif1 && dif1 < this.widthThreshold && (!dif2 || !(dif2 < dif1))) {
      // merge to the left
      let size1 = this.clusters[i-1].size
      let size2 = this.clusters[i].size
      this.clusters.splice(i-1, 2, {
        ioi: (ioi1*size1 + ioi2*size2)/(size1+size2),
        size: size1+size2,
      })

      // recur
      return this.mergeAdjacent(i-1)
    } else if(ioi3 != null && dif2 != null && dif2 < this.widthThreshold) {
      // merge to the right
      let size2 = this.clusters[i].size
      let size3 = this.clusters[i].size
      this.clusters.splice(i, 2, {
        ioi: (ioi2 * size2 + ioi3 * size3) / (size2 + size3),
        size: size2 + size3,
      })

      // recur
      return this.mergeAdjacent(i)
    }

    // Otherwise,
    return i
  }

  /**
   * Calculate/recaculate salience scores for each cluster.
   */
  refreshScores() {
    // Initialise each cluster a score of 10 * size.
    for(let i in this.clusters)
      this.clusters[i].score = 10 * this.clusters[i].size

    // Then boost scores for metrically related IOIs.
    for(let i=0; i<this.clusters.length; i++)
      for(let j=i+1; j<this.clusters.length; j++) {
        let clusterI = this.clusters[i]
        let clusterJ = this.clusters[j]

        // Get the ratio
        let ratio = clusterI.ioi / clusterJ.ioi

        let d // Integer ratio between intervals
        if(ratio < 1) {
          // Ratio is a fraction.
          d = Math.round(1/ratio) // closest integer multiple relation

          // skip if d is outside the range 2-8
          if(d < 2 || d > 8)
            continue

          // Calculate error and skip if outside threshold
          let err = Math.abs(clusterI.ioi * d - clusterJ.ioi)
          if(err >= this.widthThreshold)
            continue
        } else {
          // Ratio is not a fraction
          d = Math.round(ratio)

          // skip if d is outside the range 2-8
          if(d < 2 || d > 8)
            continue

          // Calculate error and skip if outside threshold
          let err = Math.abs(clusterI.ioi - d * clusterJ.ioi)
          if(err >= this.widthThreshold * d)
            continue
        }

        // Otherwise, increment scores depending on the integer multiple
        d = d >= 5 ? 1 : 6 - d
        clusterI.score = (clusterI.score || 0) + d * clusterJ.size
        clusterJ.score = (clusterJ.score || 0) + d * clusterI.size
      }
  }

  /**
   * Shortlist indexes of the largest clusters.
   */
  get shortlist() {
    let maxTempi = this.maxTempi
    let shortlist = this.clusters
      .map(({size}, i) => ({size, i}))
      .sort( (a, b) => b.size - a.size )
    if(shortlist.length < maxTempi) {
      for(let i=maxTempi-1; i<shortlist.length-1; i++)
        if(shortlist[i].size == shortlist[i+1].size)
          maxTempi++
        else
          break
    }
    return shortlist
      .slice(0, maxTempi)
      .map(a => a.i)
  }

  /**
   * Creates a list of hypothetical tempos (expressed as beat intervals in
   * seconds).
   */
  createTempoList() {
    let shortlist = this.shortlist
    this.refreshScores()

    let tempoList = []

    // For each event that is in the shortlist create an a cluster that includes
    // intervals in integer multiples/divisions.
    for(let i of shortlist) {
      let clusterI = this.clusters[i]
      if(clusterI.score == null)
        throw 'Something went wrong.'
      let newSum = clusterI.ioi * clusterI.score
      let newWeight = clusterI.score

      let err, errThreshold

      // For every cluster,
      for(let clusterJ of this.clusters) {
        // Skip cluster i (current shortlisted cluster)
        if(clusterJ == clusterI)
          continue

        if(clusterJ.score == null)
          throw 'Something went wrong!'

        // Get closest integer ratio between interval i and interval j
        let ratio = clusterI.ioi / clusterJ.ioi
        let isFraction = ratio < 1
        let d = isFraction ? Math.round(1 / ratio) : Math.round(ratio)

        // Skip if ratio is not in the range 2-8
        if(d < 2 || d > 8)
          continue

        // Calculate error margin when dividing clusters
        if(isFraction) {
          err = Math.abs(clusterI.ioi * d - clusterJ.ioi)
          errThreshold = this.widthThreshold
        } else {
          err = Math.abs(clusterI.ioi - d * clusterJ.ioi)
          errThreshold = this.widthThreshold * d
        }

        // Skip if error margin is outside of threshold
        if(err >= errThreshold)
          continue

        // Otherwise, adjust the mean accordingly
        if(isFraction)
          newSum += clusterJ.ioi / d * clusterJ.score
        else
          newSum += clusterJ.ioi * d * clusterJ.score
        newWeight += clusterJ.score
      }

      // Calculate the new mean for the cluster
      let beatInterval = newSum / newWeight

      // Move to within range
      while(beatInterval < this.minBeatInterval)
        beatInterval *= 2
      while(beatInterval > this.maxBeatInterval)
        beatInterval /= 2

      // Add beat interval hyposthesis to list.
      tempoList.push(beatInterval)
    }

    return tempoList
  }
}
export default IOIHistogram
