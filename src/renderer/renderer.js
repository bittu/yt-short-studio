
import './index.css';
import './fontawesome/js/all.min'
import $ from 'jquery'
import './menu/menu'

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

  $('#close').hide();

  $('#yt-url').on('keyup', () => {
    const val = $('#yt-url').val()
    if (val) {
      $('#yt-url').parent().addClass('input--filled');
      $('#process-btn').removeAttr('disabled');
      $('#process-btn svg').addClass('fa-beat-fade');
    } else {
      $('#yt-url').parent().removeClass('input--filled');
      $('#process-btn').attr('disabled', true);
      $('#process-btn svg').removeClass('fa-beat-fade');
    }
  })

  $('#close').on('click', () => {
    $('video').each((i, v) => {
      URL.revokeObjectURL(v.getAttribute('src'))
    })
    $('#split-clip__container').empty().hide();
    $('#yt-url').val('');
    $('.webflow-style-input').show();
    $('#close').hide();
    window.api.killProcesses();
  })

  $('#process-btn').on('click', async () => {
    $('.webflow-style-input').hide();
    $('.pill').show();
    $('#close').show();
    await window.api.process($('#yt-url').val().trim(), $('#watermark').is(":checked"))
    $('.pill').hide();
  })

  window.api.onUpdateProgress((event, value) => {
    console.log(event, value)
    if (value.type === "progress") {
      $('#split-clip__container').show();
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
  });

  window.api.onCacheEnabled((event, value) => {
    $('#cache-enabled span').text(value ? 'Disable cache' : 'Enable cache')
  });

  $('#cache-enabled').on('click', () => {
    window.api.setCacheEnabled($('#cache-enabled span').text() === 'Disable cache' ? false : true)
  })
  $('#delete-cache').on('click', () => {
    window.api.deleteCache()
  })

  $('#cache-enabled span').text(window.api.isCacheEnabled() ? 'Disable cache' : 'Enable cache')


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

window.onunload = () => {
  $('video').each((i, v) => {
    URL.revokeObjectURL(v.getAttribute('src'))
  })
}

console.log('👋 This message is being logged by "renderer.js", included via webpack');
