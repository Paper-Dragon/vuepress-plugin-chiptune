<template>
  <div class="chiptune-container">
    <h1>🎧 Chiptune — 芯片音乐编辑器</h1>

    <div class="top-controls">
      <fieldset class="control-group">
        <legend>生成</legend>
        <input id="seedInput" placeholder="输入种子..." value="143eil">
        <button @click="triggerRandom">🎲 随机</button>
        <label for="chaos">混沌: <span id="chaosValue">6</span></label>
        <input id="chaos" type="range" min="0" max="100" value="6">
      </fieldset>

      <fieldset class="control-group">
        <legend>音色</legend>
        <label for="scaleSelect">音阶</label>
        <select id="scaleSelect">
          <option value="major">大调</option>
          <option value="minor">小调</option>
          <option value="dorian">多里安</option>
          <option value="phrygian" selected>弗里吉安</option>
          <option value="mixolydian">混合利底安</option>
          <option value="pentatonic">五声音阶</option>
        </select>
        <label for="styleSelect">风格</label>
        <select id="styleSelect">
          <option value="pulsewave">脉冲波</option>
          <option value="dreamchip">梦幻芯片</option>
          <option value="darkgrid">黑暗网格</option>
          <option value="arcadegen">街机生成</option>
          <option value="crystal" selected>水晶</option>
        </select>
      </fieldset>

      <fieldset class="control-group">
        <legend>节奏</legend>
        <label for="bpmSlider">BPM: <span id="bpmOutput">107</span></label>
        <input id="bpmSlider" type="range" min="60" max="240" value="107" step="1">
        <label for="lengthSelect">循环长度</label>
        <select id="lengthSelect">
          <option value="8">8x</option>
          <option value="16">16x</option>
          <option value="32">32x</option>
          <option value="64" selected>64x</option>
        </select>
      </fieldset>

      <fieldset class="control-group">
        <legend>乐器</legend>
        <div class="checkbox-group">
          <label><input type="checkbox" id="useLead" checked> 主音</label>
          <label><input type="checkbox" id="useLead2" checked> 主音 2</label>
          <label><input type="checkbox" id="useBass" checked> 贝斯</label>
          <label><input type="checkbox" id="useDrums" checked> 打击乐</label>
          <label><input type="checkbox" id="useFx" checked> 特效</label>
          <label><input type="checkbox" id="useReverb"> 混响</label>
          <label><input type="checkbox" id="useDelay"> 延迟</label>
          <label><input type="checkbox" id="useChorus"> 合唱</label>
        </div>
      </fieldset>
    </div>

    <div class="main-actions">
        <button @click="generateLoop">生成</button>
        <button @click="modifySounds">修改</button>
        <button @click="remixLoop">重混</button>
        <button id="togglePlay" @click="togglePlayPause">播放/暂停</button>
        <button @click="downloadWav">⬇️ 下载 WAV</button>
        <button @click="exportMIDI">🎼 导出 MIDI</button>
    </div>

    <canvas id="pianoRoll" width="800" height="150"></canvas>
  </div>
</template>

<script>
import { init, generateLoop, modifySounds, remixLoop, togglePlayPause, downloadWav, exportMIDI, triggerRandom } from './neoloop.js';

export default {
  name: 'Chiptune',
  mounted() {
    init();
  },
  methods: {
    generateLoop,
    modifySounds,
    remixLoop,
    togglePlayPause,
    downloadWav,
    exportMIDI,
    triggerRandom
  }
}
</script>

<style scoped>
.chiptune-container {
  font-family: inherit;
  text-align: center;
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid var(--c-border, #ccc);
  max-width: 840px;
  margin: auto;
}

h1 {
  margin-bottom: 0.8rem;
  font-size: 1.2rem;
}

.top-controls {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.control-group {
  flex: 1;
  border: 1px solid var(--c-border, #ccc);
  border-radius: 4px;
  padding: 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-group legend {
  padding: 0 0.3rem;
  font-size: 0.8rem;
  font-weight: bold;
}

input,
button,
select {
  font-family: inherit;
  font-size: 0.75rem;
  border: 1px solid var(--c-border, #ccc);
  border-radius: 3px;
  padding: 0.3rem;
  width: 100%;
  box-sizing: border-box;
}

button {
  cursor: pointer;
  transition: background-color 0.2s;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.2rem; 
  padding-left: 0.5rem;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  flex-direction: row;
  white-space: nowrap;
  font-size: 0.7rem;
}

.main-actions {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

canvas {
  border: 1px solid var(--c-border, #ccc);
  border-radius: 4px;
  width: 100%;
  box-sizing: border-box;
  background: var(--c-bg-light, #f9f9f9);
  margin-bottom: 0.5rem;
}

</style>