
import './index.css';
import $ from 'jquery'
// import log from 'electron-log'

// async function init () {
//   const url = 'https://www.youtube.com/watch?v=26GToWd30kM'
//   const output = await window.api.analyse(url)
//   console.log('renderer::Landing::analyse::', output)

//   await window.api.process(url)
// }

// init();



function _init() {
  console.log('_init started')
  $('#split-clip__container').empty();

  $('#back').hide();

  $('#yt-url').on('keyup', () => {
    const val = $('#yt-url').val()
    if (val) {
      $('#yt-url').parent().addClass('input--filled');
      $('#process-btn').removeAttr('disabled');
    } else {
      $('#yt-url').parent().removeClass('input--filled');
      $('#process-btn').attr('disabled', true);
    }
  })

  $('#back').on('click', () => {
    $('#split-clip__container').empty();
    $('#yt-url').val('');
    $('.webflow-style-input').show();
    $('#back').hide();
    window.api.killProcesses();
  })

  $('#process-btn').on('click', async () => {
    $('.webflow-style-input').hide();
    $('.pill').show();
    $('#back').show();
    await window.api.process($('#yt-url').val().trim())
    $('.pill').hide();
  })

  window.api.onUpdateProgress((event, value) => {
    console.log(event, value)
    if (value.type === "progress") {
      console.log(value.log);
      if (value.main) {
        renderSubClip(null, value.main)
      }
      if (value.data) {
        const name = value.data.name.replace('.mp4', '');
        if ($(`#${name}`).length) {
          $(`#${name} .progress-bar`).width(`${value.data.percent}%`);
          if (value.data.status === 'end') {
            $(`#${name} .progress-bar`).width(`100%`);
            renderSubClip(name, value.data.outputPath);
          }
        } else {
          $('#split-clip__container').append(`
            <div class="split-clip" id="${name}">
              <h4>${name}.mp4</h4>
              <div class="progress">
                <div class="progress-bar"></div>
              </div>
              <video controls></video>
            <div>
          `)
        }
      }
    }
  })

  // $('#yt-url').val('https://www.youtube.com/watch?v=26GToWd30kM').trigger('change');
  // $('#yt-url').trigger('change')

  console.log('_init done')
}

async function renderSubClip(name, filePath) {
  const blobData = await window.api.getFileBlobData(filePath);
  const blobUrl = URL.createObjectURL(
    new Blob([blobData.buffer], { type: 'video/mp4' })
  )
  if (name) {
    $(`#${name} video`).attr('src', blobUrl).show()
  } else {
    $('<video controls></video>').attr('src', blobUrl).appendTo('#split-clip__container')
  }
}

$(_init)

console.log('👋 This message is being logged by "renderer.js", included via webpack');
