<script lang="ts">
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import Icon from "@iconify/svelte";
import { getDefaultHue, getHue, getReadingSize, setHue, setReadingSize } from "@utils/setting-utils";
import type { ReadingSize } from "@utils/setting-utils";

let hue = getHue();
const defaultHue = getDefaultHue();
let readingSize: ReadingSize = getReadingSize();
const readingOptions: { value: ReadingSize; label: string }[] = [
	{ value: "sm", label: "小" },
	{ value: "md", label: "标准" },
	{ value: "lg", label: "大" },
];

function resetHue() {
	hue = getDefaultHue();
}

$: if (hue || hue === 0) {
	setHue(hue);
}
$: setReadingSize(readingSize);
</script>

<div id="display-setting" translate="no" class="float-panel float-panel-closed absolute transition-all w-80 right-4 px-4 py-4">
    <div class="flex flex-row gap-2 mb-3 items-center justify-between">
        <div class="flex gap-2 font-bold text-lg text-neutral-900 dark:text-neutral-100 transition relative ml-3
            before:w-1 before:h-4 before:rounded-md before:bg-[var(--primary)]
            before:absolute before:-left-3 before:top-[0.33rem]"
        >
            {i18n(I18nKey.themeColor)}
            <button aria-label="Reset to Default" class="btn-regular w-7 h-7 rounded-md  active:scale-90 will-change-transform"
                    class:opacity-0={hue === defaultHue} class:pointer-events-none={hue === defaultHue} on:click={resetHue}>
                <div class="text-[var(--btn-content)]">
                    <Icon icon="fa6-solid:arrow-rotate-left" class="text-[0.875rem]"></Icon>
                </div>
            </button>
        </div>
        <div class="flex gap-1">
            <div id="hueValue" class="transition bg-[var(--btn-regular-bg)] w-10 h-7 rounded-md flex justify-center
            font-bold text-sm items-center text-[var(--btn-content)]">
                {hue}
            </div>
        </div>
    </div>
    <div class="w-full h-6 px-1 bg-[oklch(0.80_0.10_0)] dark:bg-[oklch(0.70_0.10_0)] rounded select-none">
        <input aria-label={i18n(I18nKey.themeColor)} type="range" min="0" max="360" bind:value={hue}
               class="slider" id="colorSlider" step="5" style="width: 100%">
    </div>
    <div class="mt-4 flex items-center justify-between gap-3">
        <span class="text-sm font-bold text-neutral-900 dark:text-neutral-100 transition">阅读字号</span>
        <div class="flex items-center gap-1 rounded-lg bg-[var(--btn-regular-bg)] p-1" role="group" aria-label="阅读字号">
            {#each readingOptions as option}
                <button
                    type="button"
                    class="reading-size-option"
                    class:is-active={readingSize === option.value}
                    aria-pressed={readingSize === option.value}
                    on:click={() => (readingSize = option.value)}
                >
                    {option.label}
                </button>
            {/each}
        </div>
    </div>
</div>


<style lang="stylus">
    #display-setting
      input[type="range"]
        -webkit-appearance none
        height 1.5rem
        background-image var(--color-selection-bar)
        transition background-image 0.15s ease-in-out

        /* Input Thumb */
        &::-webkit-slider-thumb
          -webkit-appearance none
          height 1rem
          width 0.5rem
          border-radius 0.125rem
          background rgba(255, 255, 255, 0.7)
          box-shadow none
          &:hover
            background rgba(255, 255, 255, 0.8)
          &:active
            background rgba(255, 255, 255, 0.6)

        &::-moz-range-thumb
          -webkit-appearance none
          height 1rem
          width 0.5rem
          border-radius 0.125rem
          border-width 0
          background rgba(255, 255, 255, 0.7)
          box-shadow none
          &:hover
            background rgba(255, 255, 255, 0.8)
          &:active
            background rgba(255, 255, 255, 0.6)

        &::-ms-thumb
          -webkit-appearance none
          height 1rem
          width 0.5rem
          border-radius 0.125rem
          background rgba(255, 255, 255, 0.7)
          box-shadow none
          &:hover
            background rgba(255, 255, 255, 0.8)
          &:active
            background rgba(255, 255, 255, 0.6)

    #display-setting .reading-size-option
      min-width 2.75rem
      height 2rem
      padding 0 0.5rem
      border-radius 0.45rem
      font-size 0.75rem
      font-weight 700
      color var(--deep-text)
      transition background 0.15s ease, color 0.15s ease
      cursor pointer

    #display-setting .reading-size-option.is-active
      background var(--card-bg)
      color var(--primary)
      box-shadow 0 1px 4px rgba(0, 0, 0, 0.12)

</style>
