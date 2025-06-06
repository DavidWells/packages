const fs = require('fs')
const path = require('path')
const iconPipeline = require('icon-pipeline')

const ROOT_DIR = path.join(__dirname)
const ICON_FOLDER = path.join(ROOT_DIR, 'src/assets/icons')
const OUTPUT_FOLDER = path.join(ROOT_DIR, 'build/icons')

async function makeIcons() {
  let iconData
  try {
    iconData = await iconPipeline({
      /* Location of non optimized svg icons */
      srcDir: ICON_FOLDER,
      /* Output directory for optimized svg icons & svg sprite */
      outputDir: OUTPUT_FOLDER,
      /* Includes the sprite.js && sprite.svg in original icon directory */
      includeSpriteInSrc: true,
    })
  } catch (error) {
    console.log('error', error)
  }
  console.log('iconData', iconData)

  /* Add icon list to src & output */
  const iconJson = JSON.stringify(iconData.iconMap, null, 2)
  fs.writeFileSync(path.join(ICON_FOLDER, 'icon-list.json'), iconJson)
  fs.writeFileSync(path.join(OUTPUT_FOLDER, 'icon-list.json'), iconJson)
}

makeIcons()
