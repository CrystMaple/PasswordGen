function getValidArray(arrayLength, elementBorder) {
    const validArray = new Uint8Array(arrayLength);
    let validCount = 0;
    while (validCount < arrayLength) {
        const needed = arrayLength - validCount;
        const rawRandom = new Uint8Array(needed);
        self.crypto.getRandomValues(rawRandom);
        for (let i = 0; i < needed; i++)
            if (rawRandom[i] < elementBorder)
                validArray[validCount++] = rawRandom[i];
    }
    return validArray;
}
function genPasswd(options) {
    const charType = [];
    let altChar = '';
    if (options.component.capital) {
        const str = options.doExclude ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        altChar += str;
        charType.push(...Array(str.length).fill(0));
    }
    if (options.component.lowercase) {
        const str = options.doExclude ? 'abcdefghijkmnopqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
        altChar += str;
        charType.push(...Array(str.length).fill(1));
    }
    if (options.component.number) {
        const str = options.doExclude ? '123456789' : '0123456789';
        altChar += str;
        charType.push(...Array(str.length).fill(2));
    }
    if (options.component.character) {
        const str = '!@#$&*():;?,./';
        altChar += str;
        charType.push(...Array(str.length).fill(3));
    }
    if (!altChar.length)
        throw new Error('未选择任何字符类型');
    const randomValueBorder = 256 - 256 % altChar.length;
    do {
        var typeFreq = Array(4).fill(0), result = Array(options.pwlength);
        var randomArray = getValidArray(options.pwlength, randomValueBorder);
        for (let i = 0; i < options.pwlength; i++) {
            const idx = randomArray[i] % altChar.length;
            result[i] = altChar[idx];
            typeFreq[charType[idx]]++;
        }
    } while (options.doCheck && (options.component.capital && !typeFreq[0] || options.component.lowercase && !typeFreq[1] || options.component.number && !typeFreq[2] || options.component.character && !typeFreq[3]));
    return result.join('');
}
const presets = {
    common: {
        simple: {
            component: {
                capital: true,
                lowercase: true,
                number: true,
                character: false
            },
            pwlength: 8,
            doExclude: true,
            doCheck: true
        },
        normal: {
            component: {
                capital: true,
                lowercase: true,
                number: true,
                character: true
            },
            pwlength: 12,
            doExclude: true,
            doCheck: true
        },
        complex: {
            component: {
                capital: true,
                lowercase: true,
                number: true,
                character: true
            },
            pwlength: 16,
            doExclude: true,
            doCheck: true
        }
    },
    pin: {
        4: {
            component: {
                capital: false,
                lowercase: false,
                number: true,
                character: false
            },
            pwlength: 4,
            doExclude: false,
            doCheck: false
        },
        6: {
            component: {
                capital: false,
                lowercase: false,
                number: true,
                character: false
            },
            pwlength: 6,
            doExclude: false,
            doCheck: false
        }
    }
}
var currentPage = 'common';
function refreshPasswd () {
    switch (currentPage) {
        case 'common':
            $('#result-box').val(genPasswd(presets.common[$('input[name="strength"]:checked').val()]));
            break;
        case 'pin':
            $('#result-box').val(genPasswd(presets.pin[$('input[name="pinlength"]:checked').val()]));
            break;
        case 'identifier':
            if($('#idtype-uuid').prop('checked'))
                $('#result-box').val(self.crypto.randomUUID());
            break;
        default:
            var customConfig = {
                component: {
                    capital: $('#component-capital').prop('checked'),
                    lowercase: $('#component-lowercase').prop('checked'),
                    number: $('#component-number').prop('checked'),
                    character: $('#component-character').prop('checked')
                },
                pwlength: $('#length').val(),
                doExclude: $('#extra-exclude').prop('checked'),
                doCheck: $('#extra-check').prop('checked')
            };
            var numChecked = $('.component:checked').length;
            if (numChecked == 0)
                return;
            if (customConfig.doCheck && numChecked > customConfig.pwlength)
                return;
            $('#result-box').val(genPasswd(customConfig));
    }
    $('#copy-icon').prop('class', 'fa-solid fa-copy');
    $('#copy-label').text('复制');
}
function tabSwitch (target) {
    if (currentPage == target)
        return;
    $('#tab-' + currentPage).css('background-color', '#dadada');
    $('#tab-' + currentPage).css('color', '#222');
    $('#tab-' + target).css('background-color', '#007d2f');
    $('#tab-' + target).css('color', '#fff');
    $('#page-' + currentPage).hide();
    $('#page-' + target).show();
    currentPage = target;
    refreshPasswd();
}
$('#tab-common').click(function () {
    tabSwitch('common');
});
$('#tab-pin').click(function () {
    tabSwitch('pin');
});
$('#tab-identifier').click(function () {
    tabSwitch('identifier');
});
$('#tab-custom').click(function () {
    tabSwitch('custom');
});
$('input:not(.component,#length,#extra-check)').change(function () {
    refreshPasswd();
});
$('#button-copy').click(function () {
    navigator.clipboard.writeText($('#result-box').val()).then(
        function () {
            $('#copy-icon').prop('class', 'fa-solid fa-check');
            $('#copy-label').text('已复制');
        },
        function () {
            $('#copy-icon').prop('class', 'fa-solid fa-xmark');
            $('#copy-label').text('复制失败');
        }
    )
});
$('#button-refresh').click(function () {
    refreshPasswd();
});
$('#button-about').click(function () {
    document.getElementsByTagName('dialog')[0].showModal();
});
$('.component').change(function () {
    var numChecked = $('.component:checked').length;
    if (numChecked == 0) {
        this.checked = true;
        return;
    }
    $('#length').prop('min', numChecked);
    if ($('#length').val() < numChecked)
        $('#length').val(numChecked);
    refreshPasswd();
});
$('#length').change(function () {
    $('#length').val(Math.max($('.component:checked').length * $('#extra-check').prop('checked'), Math.round($('#length').val()), 1));
    $('#length').val(Math.min($('#length').val(), 65536));
    refreshPasswd();
});
$('#extra-check').change(function () {
    if ($('#extra-check').prop('checked')) {
        var numChecked = $('.component:checked').length;
        $('#length').prop('min', numChecked);
        if ($('#length').val() < numChecked)
            $('#length').val(numChecked);
    }
    else
        $('#length').prop('min', 1);
    refreshPasswd();
});
$('#close-dialog').click(function () {
    document.getElementsByTagName('dialog')[0].close();
});
$(function () {
    refreshPasswd();
});