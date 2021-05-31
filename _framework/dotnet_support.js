// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.

var DotNetSupportLib = {
	$DOTNET: {
		conv_string: function (mono_obj) {
			return MONO.string_decoder.copy (mono_obj);
		}
	},
	mono_wasm_invoke_js_blazor: function(exceptionMessage, callInfo, arg0, arg1, arg2)	{
		var mono_string = globalThis._mono_string_cached
			|| (globalThis._mono_string_cached = Module.cwrap('mono_wasm_string_from_js', 'number', ['string']));

		try {
			var blazorExports = globalThis.Blazor;
			if (!blazorExports) {
				throw new Error('The blazor.webassembly.js library is not loaded.');
			}

			return blazorExports._internal.invokeJSFromDotNet(callInfo, arg0, arg1, arg2);
		} catch (ex) {
			var exceptionJsString = ex.message + '\n' + ex.stack;
			var exceptionSystemString = mono_string(exceptionJsString);
			setValue (exceptionMessage, exceptionSystemString, 'i32'); // *exceptionMessage = exceptionSystemString;
			return 0;
		}
	},

	// This is for back-compat only and will eventually be removed
	mono_wasm_invoke_js_marshalled: function(exceptionMessage, asyncHandleLongPtr, functionName, argsJson, treatResultAsVoid) {

		var mono_string = globalThis._mono_string_cached
			|| (globalThis._mono_string_cached = Module.cwrap('mono_wasm_string_from_js', 'number', ['string']));

		try {
			// Passing a .NET long into JS via Emscripten is tricky. The method here is to pass
			// as pointer to the long, then combine two reads from the HEAPU32 array.
			// Even though JS numbers can't represent the full range of a .NET long, it's OK
			// because we'll never exceed Number.MAX_SAFE_INTEGER (2^53 - 1) in this case.
			//var u32Index = $1 >> 2;
			var u32Index = asyncHandleLongPtr >> 2;
			var asyncHandleJsNumber = Module.HEAPU32[u32Index + 1]*4294967296 + Module.HEAPU32[u32Index];

			// var funcNameJsString = UTF8ToString (functionName);
			// var argsJsonJsString = argsJson && UTF8ToString (argsJson);
			var funcNameJsString = DOTNET.conv_string(functionName);
			var argsJsonJsString = argsJson && DOTNET.conv_string (argsJson);

			var dotNetExports = globaThis.DotNet;
			if (!dotNetExports) {
				throw new Error('The Microsoft.JSInterop.js library is not loaded.');
			}

			if (asyncHandleJsNumber) {
				dotNetExports.jsCallDispatcher.beginInvokeJSFromDotNet(asyncHandleJsNumber, funcNameJsString, argsJsonJsString, treatResultAsVoid);
				return 0;
			} else {
				var resultJson = dotNetExports.jsCallDispatcher.invokeJSFromDotNet(funcNameJsString, argsJsonJsString, treatResultAsVoid);
				return resultJson === null ? 0 : mono_string(resultJson);
			}
		} catch (ex) {
			var exceptionJsString = ex.message + '\n' + ex.stack;
			var exceptionSystemString = mono_string(exceptionJsString);
			setValue (exceptionMessage, exceptionSystemString, 'i32'); // *exceptionMessage = exceptionSystemString;
			return 0;
		}
	},

	// This is for back-compat only and will eventually be removed
	mono_wasm_invoke_js_unmarshalled: function(exceptionMessage, funcName, arg0, arg1, arg2)	{
		try {
			// Get the function you're trying to invoke
			var funcNameJsString = DOTNET.conv_string(funcName);
			var dotNetExports = globalThis.DotNet;
			if (!dotNetExports) {
				throw new Error('The Microsoft.JSInterop.js library is not loaded.');
			}
			var funcInstance = dotNetExports.jsCallDispatcher.findJSFunction(funcNameJsString);

			return funcInstance.call(null, arg0, arg1, arg2);
		} catch (ex) {
			var exceptionJsString = ex.message + '\n' + ex.stack;
			var mono_string = Module.cwrap('mono_wasm_string_from_js', 'number', ['string']); // TODO: Cache
			var exceptionSystemString = mono_string(exceptionJsString);
			setValue (exceptionMessage, exceptionSystemString, 'i32'); // *exceptionMessage = exceptionSystemString;
			return 0;
		}
	}


};

autoAddDeps(DotNetSupportLib, '$DOTNET')
mergeInto(LibraryManager.library, DotNetSupportLib)


// SIG // Begin signature block
// SIG // MIIkjAYJKoZIhvcNAQcCoIIkfTCCJHkCAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // DQxM5aUosMIFmI353dLRcro0jWTAvinWkY5FLkoNZqCg
// SIG // gg3wMIIGbjCCBFagAwIBAgITMwAAAhOMDBwxNbzSXwAA
// SIG // AAACEzANBgkqhkiG9w0BAQwFADB+MQswCQYDVQQGEwJV
// SIG // UzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMH
// SIG // UmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBv
// SIG // cmF0aW9uMSgwJgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBT
// SIG // aWduaW5nIFBDQSAyMDExMB4XDTIxMDIxMTIwMDk1MVoX
// SIG // DTIyMDIxMDIwMDk1MVowYzELMAkGA1UEBhMCVVMxEzAR
// SIG // BgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1v
// SIG // bmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlv
// SIG // bjENMAsGA1UEAxMELk5FVDCCAaIwDQYJKoZIhvcNAQEB
// SIG // BQADggGPADCCAYoCggGBAJtZcELdrGHlHCF6nz4bH8vW
// SIG // l5M3GfXIf7JY7OovRwgweTptJQGby0YHZ+iCrWIE7fTc
// SIG // /c9eGKGm+EsuWHnanAm9Ro7MSjdPsYBRaif1Y6dyhBcb
// SIG // b44guUNKlplq7L1k3ldXFFzyAt+u8UzCL5QFwibg2nWi
// SIG // QmCkoJWhiA6RxEPgEZ/ss2ICppgLHm1o6vy1P4ci6aMk
// SIG // Tj2s1uct/oFflYwE0DsK1OrFH7QvoIqWCAuXUXjZOKnF
// SIG // oRia22+ci2oxs/LVkgqcMwC35KHvUBzCW3LME/dSBWCO
// SIG // TV7gieG+gUtxBgPpzomak4thtrQLMRAWl7AOtI7QvsXa
// SIG // FEyQpAlDVz12Sa89KJOLBPksBRDw4woRZLlHnUrtxFRp
// SIG // MZsr+9cf2zfZPG4ia2iDSBFfXu2BeXrifkT4c/UV5Iy3
// SIG // qEHCzh1jLmN701jUOhF1QN1LEPn+TCth2b239/34+Bym
// SIG // cIAcDP1EWk8JodsUDedKhK+lAefNL0mzUrIQc6Dxb5cq
// SIG // may/QQIDAQABo4IBfjCCAXowHwYDVR0lBBgwFgYKKwYB
// SIG // BAGCN0wIAQYIKwYBBQUHAwMwHQYDVR0OBBYEFO9NaSC3
// SIG // 3IwsQ0OKpWHnclste605MFAGA1UdEQRJMEekRTBDMSkw
// SIG // JwYDVQQLEyBNaWNyb3NvZnQgT3BlcmF0aW9ucyBQdWVy
// SIG // dG8gUmljbzEWMBQGA1UEBRMNNDY0MjIzKzQ2NDI5MzAf
// SIG // BgNVHSMEGDAWgBRIbmTlUAXTgqoXNzcitW2oynUClTBU
// SIG // BgNVHR8ETTBLMEmgR6BFhkNodHRwOi8vd3d3Lm1pY3Jv
// SIG // c29mdC5jb20vcGtpb3BzL2NybC9NaWNDb2RTaWdQQ0Ey
// SIG // MDExXzIwMTEtMDctMDguY3JsMGEGCCsGAQUFBwEBBFUw
// SIG // UzBRBggrBgEFBQcwAoZFaHR0cDovL3d3dy5taWNyb3Nv
// SIG // ZnQuY29tL3BraW9wcy9jZXJ0cy9NaWNDb2RTaWdQQ0Ey
// SIG // MDExXzIwMTEtMDctMDguY3J0MAwGA1UdEwEB/wQCMAAw
// SIG // DQYJKoZIhvcNAQEMBQADggIBAFiD+cR0K6evMUeUrBMA
// SIG // pLljV65GDDTzlD4jqr6Mu1NTeZv5L9IJlR6DLAEKaJnB
// SIG // a7fZZ/ME/FZasmc40+WijhDmth/OOc7IpfJ3Ra1auKIA
// SIG // g687mo/eWiPs0nC42oCdchy9Q5AS7K0+MUk7R/p9eCTP
// SIG // NYFjSMItiL+YFYCxaZXqHizwdXcvCIrESq4DXwN+ZdUe
// SIG // GBEO9F2SkMVC61/y2xwSwRWmfO/l4YutKT+dSKjlelYi
// SIG // zFAQaJrGzO5ac56S+K/NMndPL7Od3ohqxMu7gsFUynxY
// SIG // l+eyB9T9I9HrUWoHj6ce4nzOxHC+yDRD6Mi2AaT+IbMO
// SIG // cGvWeJC5iX3tzpMqdz0BOMl6jbff+t+BLS7VtU6JAFCM
// SIG // fk5h+wqIPWjon3tpTuFtCkMOSzIoso3U6kdX0fgrgXnN
// SIG // KJspBXkfKG9lMPOPOKwzua1qjghvgzPMftj1yZqFljJm
// SIG // cjBxs/HKA8J8st1MKcgiBGDX5zkcsHYGuAkIb2fXQuYW
// SIG // y0G78JzzSv1u0LAFj8/Qtx9Hm2wfc20+ww+MYEQ9tu1F
// SIG // uJZK2O7+p7iVziwZvo+XVzuIU7sVjcmJH5Gn/ttfkLQ3
// SIG // 0jvM9QyV/lYwurg4Gn5Li/IZSN56WGIPilRkXUVurpaV
// SIG // WeYCjeUJzMY2n2tVMFl6pgnGmaA2a0uiG3z0GpMPdbS1
// SIG // R/oEMIIHejCCBWKgAwIBAgIKYQ6Q0gAAAAAAAzANBgkq
// SIG // hkiG9w0BAQsFADCBiDELMAkGA1UEBhMCVVMxEzARBgNV
// SIG // BAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQx
// SIG // HjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEy
// SIG // MDAGA1UEAxMpTWljcm9zb2Z0IFJvb3QgQ2VydGlmaWNh
// SIG // dGUgQXV0aG9yaXR5IDIwMTEwHhcNMTEwNzA4MjA1OTA5
// SIG // WhcNMjYwNzA4MjEwOTA5WjB+MQswCQYDVQQGEwJVUzET
// SIG // MBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVk
// SIG // bW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0
// SIG // aW9uMSgwJgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBTaWdu
// SIG // aW5nIFBDQSAyMDExMIICIjANBgkqhkiG9w0BAQEFAAOC
// SIG // Ag8AMIICCgKCAgEAq/D6chAcLq3YbqqCEE00uvK2WCGf
// SIG // Qhsqa+laUKq4BjgaBEm6f8MMHt03a8YS2AvwOMKZBrDI
// SIG // OdUBFDFC04kNeWSHfpRgJGyvnkmc6Whe0t+bU7IKLMOv
// SIG // 2akrrnoJr9eWWcpgGgXpZnboMlImEi/nqwhQz7NEt13Y
// SIG // xC4Ddato88tt8zpcoRb0RrrgOGSsbmQ1eKagYw8t00CT
// SIG // +OPeBw3VXHmlSSnnDb6gE3e+lD3v++MrWhAfTVYoonpy
// SIG // 4BI6t0le2O3tQ5GD2Xuye4Yb2T6xjF3oiU+EGvKhL1nk
// SIG // kDstrjNYxbc+/jLTswM9sbKvkjh+0p2ALPVOVpEhNSXD
// SIG // OW5kf1O6nA+tGSOEy/S6A4aN91/w0FK/jJSHvMAhdCVf
// SIG // GCi2zCcoOCWYOUo2z3yxkq4cI6epZuxhH2rhKEmdX4ji
// SIG // JV3TIUs+UsS1Vz8kA/DRelsv1SPjcF0PUUZ3s/gA4bys
// SIG // AoJf28AVs70b1FVL5zmhD+kjSbwYuER8ReTBw3J64HLn
// SIG // JN+/RpnF78IcV9uDjexNSTCnq47f7Fufr/zdsGbiwZeB
// SIG // e+3W7UvnSSmnEyimp31ngOaKYnhfsi+E11ecXL93KCjx
// SIG // 7W3DKI8sj0A3T8HhhUSJxAlMxdSlQy90lfdu+HggWCwT
// SIG // XWCVmj5PM4TasIgX3p5O9JawvEagbJjS4NaIjAsCAwEA
// SIG // AaOCAe0wggHpMBAGCSsGAQQBgjcVAQQDAgEAMB0GA1Ud
// SIG // DgQWBBRIbmTlUAXTgqoXNzcitW2oynUClTAZBgkrBgEE
// SIG // AYI3FAIEDB4KAFMAdQBiAEMAQTALBgNVHQ8EBAMCAYYw
// SIG // DwYDVR0TAQH/BAUwAwEB/zAfBgNVHSMEGDAWgBRyLToC
// SIG // MZBDuRQFTuHqp8cx0SOJNDBaBgNVHR8EUzBRME+gTaBL
// SIG // hklodHRwOi8vY3JsLm1pY3Jvc29mdC5jb20vcGtpL2Ny
// SIG // bC9wcm9kdWN0cy9NaWNSb29DZXJBdXQyMDExXzIwMTFf
// SIG // MDNfMjIuY3JsMF4GCCsGAQUFBwEBBFIwUDBOBggrBgEF
// SIG // BQcwAoZCaHR0cDovL3d3dy5taWNyb3NvZnQuY29tL3Br
// SIG // aS9jZXJ0cy9NaWNSb29DZXJBdXQyMDExXzIwMTFfMDNf
// SIG // MjIuY3J0MIGfBgNVHSAEgZcwgZQwgZEGCSsGAQQBgjcu
// SIG // AzCBgzA/BggrBgEFBQcCARYzaHR0cDovL3d3dy5taWNy
// SIG // b3NvZnQuY29tL3BraW9wcy9kb2NzL3ByaW1hcnljcHMu
// SIG // aHRtMEAGCCsGAQUFBwICMDQeMiAdAEwAZQBnAGEAbABf
// SIG // AHAAbwBsAGkAYwB5AF8AcwB0AGEAdABlAG0AZQBuAHQA
// SIG // LiAdMA0GCSqGSIb3DQEBCwUAA4ICAQBn8oalmOBUeRou
// SIG // 09h0ZyKbC5YR4WOSmUKWfdJ5DJDBZV8uLD74w3LRbYP+
// SIG // vj/oCso7v0epo/Np22O/IjWll11lhJB9i0ZQVdgMknzS
// SIG // Gksc8zxCi1LQsP1r4z4HLimb5j0bpdS1HXeUOeLpZMlE
// SIG // PXh6I/MTfaaQdION9MsmAkYqwooQu6SpBQyb7Wj6aC6V
// SIG // oCo/KmtYSWMfCWluWpiW5IP0wI/zRive/DvQvTXvbiWu
// SIG // 5a8n7dDd8w6vmSiXmE0OPQvyCInWH8MyGOLwxS3OW560
// SIG // STkKxgrCxq2u5bLZ2xWIUUVYODJxJxp/sfQn+N4sOiBp
// SIG // mLJZiWhub6e3dMNABQamASooPoI/E01mC8CzTfXhj38c
// SIG // bxV9Rad25UAqZaPDXVJihsMdYzaXht/a8/jyFqGaJ+HN
// SIG // pZfQ7l1jQeNbB5yHPgZ3BtEGsXUfFL5hYbXw3MYbBL7f
// SIG // QccOKO7eZS/sl/ahXJbYANahRr1Z85elCUtIEJmAH9AA
// SIG // KcWxm6U/RXceNcbSoqKfenoi+kiVH6v7RyOA9Z74v2u3
// SIG // S5fi63V4GuzqN5l5GEv/1rMjaHXmr/r8i+sLgOppO6/8
// SIG // MO0ETI7f33VtY5E90Z1WTk+/gFcioXgRMiF670EKsT/7
// SIG // qMykXcGhiJtXcVZOSEXAQsmbdlsKgEhr/Xmfwb1tbWrJ
// SIG // UnMTDXpQzTGCFfQwghXwAgEBMIGVMH4xCzAJBgNVBAYT
// SIG // AlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQH
// SIG // EwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29y
// SIG // cG9yYXRpb24xKDAmBgNVBAMTH01pY3Jvc29mdCBDb2Rl
// SIG // IFNpZ25pbmcgUENBIDIwMTECEzMAAAITjAwcMTW80l8A
// SIG // AAAAAhMwDQYJYIZIAWUDBAIBBQCgga4wGQYJKoZIhvcN
// SIG // AQkDMQwGCisGAQQBgjcCAQQwHAYKKwYBBAGCNwIBCzEO
// SIG // MAwGCisGAQQBgjcCARUwLwYJKoZIhvcNAQkEMSIEIPei
// SIG // aMpT7aW0G0eaO4V7u+OYsUIWBD2V6EuD1ajffj24MEIG
// SIG // CisGAQQBgjcCAQwxNDAyoBSAEgBNAGkAYwByAG8AcwBv
// SIG // AGYAdKEagBhodHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20w
// SIG // DQYJKoZIhvcNAQEBBQAEggGASEblTgnTmkn+iGPTMgPr
// SIG // +5uptto3kTMfvkelPQ3w/xHmtXcAdH24QMN1aSgRgQkH
// SIG // oHsEzQgzSVBwR5jRH/yeM8rA3JqNHY7Gqo1Mhjz6KSxh
// SIG // 4n1YHmD+QYcpt1jSkqWvV6APQhsYyFv+0SsiAErlDRrv
// SIG // vuIHM5xjmVi5yjW2GGOLDtKN0UOtWS3Fagjdv4L02kXi
// SIG // a4XX9rRjzh8ykJawJrd/OgFKbBZlk/O/5ClWVMQ0ijoQ
// SIG // 5Gb2olho4CZ3M0cqsCigz8GMtQDEKb2y4MYYUrKHlkmo
// SIG // tW+q5Jqhw+ocM7sOIz/EIWfjw/D+Lz44N2oQag0MwW0o
// SIG // 0JBk4TcqIHkiYZ1At70J118HmWllMsh35TDgZTD6Ds7W
// SIG // NEG9Y7e+0GwRiva/wLQq/L6vGDtMfBXBJCwpNuwlniok
// SIG // bY4LFW45OtTkCBleFPyuTyNzz7DkG0+XJhE5fw3H6Tsy
// SIG // VgHbV3fAUM76vS/rVrihi6M+M7HejkC7il15R8lqm2La
// SIG // NUG0IugSoYIS/jCCEvoGCisGAQQBgjcDAwExghLqMIIS
// SIG // 5gYJKoZIhvcNAQcCoIIS1zCCEtMCAQMxDzANBglghkgB
// SIG // ZQMEAgEFADCCAVkGCyqGSIb3DQEJEAEEoIIBSASCAUQw
// SIG // ggFAAgEBBgorBgEEAYRZCgMBMDEwDQYJYIZIAWUDBAIB
// SIG // BQAEILs+o5Vp2Uu3D+piTqZS72r4qxA46uSkXA4muDH6
// SIG // FxXaAgZgis3XCdAYEzIwMjEwNTEwMTg1NTE3Ljk2Nlow
// SIG // BIACAfSggdikgdUwgdIxCzAJBgNVBAYTAlVTMRMwEQYD
// SIG // VQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25k
// SIG // MR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24x
// SIG // LTArBgNVBAsTJE1pY3Jvc29mdCBJcmVsYW5kIE9wZXJh
// SIG // dGlvbnMgTGltaXRlZDEmMCQGA1UECxMdVGhhbGVzIFRT
// SIG // UyBFU046MDg0Mi00QkU2LUMyOUExJTAjBgNVBAMTHE1p
// SIG // Y3Jvc29mdCBUaW1lLVN0YW1wIFNlcnZpY2Wggg5NMIIE
// SIG // +TCCA+GgAwIBAgITMwAAATnM6OhDi/A04QAAAAABOTAN
// SIG // BgkqhkiG9w0BAQsFADB8MQswCQYDVQQGEwJVUzETMBEG
// SIG // A1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9u
// SIG // ZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9u
// SIG // MSYwJAYDVQQDEx1NaWNyb3NvZnQgVGltZS1TdGFtcCBQ
// SIG // Q0EgMjAxMDAeFw0yMDEwMTUxNzI4MjFaFw0yMjAxMTIx
// SIG // NzI4MjFaMIHSMQswCQYDVQQGEwJVUzETMBEGA1UECBMK
// SIG // V2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwG
// SIG // A1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMS0wKwYD
// SIG // VQQLEyRNaWNyb3NvZnQgSXJlbGFuZCBPcGVyYXRpb25z
// SIG // IExpbWl0ZWQxJjAkBgNVBAsTHVRoYWxlcyBUU1MgRVNO
// SIG // OjA4NDItNEJFNi1DMjlBMSUwIwYDVQQDExxNaWNyb3Nv
// SIG // ZnQgVGltZS1TdGFtcCBTZXJ2aWNlMIIBIjANBgkqhkiG
// SIG // 9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2hP5jOMlkyWhjrMq
// SIG // BvyiePhaH5g3T39Qwdu6HqAnWcLlz9/ZKoC/QFz45gb0
// SIG // ad14IvqFaFm2J6o+vhhbf4oQJOHDTcjZXBKQTbQT/w6L
// SIG // CWvdCXnFQl2a8nEd42EmE7rxRVmKumbHoEKV+QwYdGc7
// SIG // 0q5O8M2YkqJ/StcrFhFtmhFxcvVZ+gg4azzvE87+soIz
// SIG // YV6zqM2KWO/TSy9Zeoi5X4QobV6AKuwJH08ySZ2lQBXz
// SIG // nd8rwDzy6+BYqJXim+b+V+7E3741b6cQ9fmONApHLhkG
// SIG // qo07/B14NkGqqO978hAjXtVoQpKjKu6yxXzsspQnj0rl
// SIG // fsV/HySW/l+izx7KTwIDAQABo4IBGzCCARcwHQYDVR0O
// SIG // BBYEFJmem4ZyVMKZ2pKKsZ9G9lAtBgzpMB8GA1UdIwQY
// SIG // MBaAFNVjOlyKMZDzQ3t8RhvFM2hahW1VMFYGA1UdHwRP
// SIG // ME0wS6BJoEeGRWh0dHA6Ly9jcmwubWljcm9zb2Z0LmNv
// SIG // bS9wa2kvY3JsL3Byb2R1Y3RzL01pY1RpbVN0YVBDQV8y
// SIG // MDEwLTA3LTAxLmNybDBaBggrBgEFBQcBAQROMEwwSgYI
// SIG // KwYBBQUHMAKGPmh0dHA6Ly93d3cubWljcm9zb2Z0LmNv
// SIG // bS9wa2kvY2VydHMvTWljVGltU3RhUENBXzIwMTAtMDct
// SIG // MDEuY3J0MAwGA1UdEwEB/wQCMAAwEwYDVR0lBAwwCgYI
// SIG // KwYBBQUHAwgwDQYJKoZIhvcNAQELBQADggEBAFhcKGrz
// SIG // /zcahc3BWu1Dgoi/EA2xJvu69hGIk6FtIPHXWMiuVmtR
// SIG // QHf8pyQ9asnP2ccfRz/dMqlyk/q8+INcCLEElpSgm91x
// SIG // uCFYbFhAhLJtoozf38aH5rY2ZxWN9buDEknJfiGiK6Q+
// SIG // 8kkCNWmbWj2DxRwEF8IfBwjF7EPhYDgdilKz486uwhgo
// SIG // sor1GuDWilYjGoMNq3lrwDIkY/83KUpJhorlpiBdkINE
// SIG // sVkCfzyELme9C3tamZtMSXxrUZwX6Wrf3dSYEAqy36PJ
// SIG // ZJriwTwhvzjIeqD8eKzUUh3ufE2/EjEAbabBhCo2+tUo
// SIG // ynT6TAJtjdiva4g7P73/VQrScMcwggZxMIIEWaADAgEC
// SIG // AgphCYEqAAAAAAACMA0GCSqGSIb3DQEBCwUAMIGIMQsw
// SIG // CQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQ
// SIG // MA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9z
// SIG // b2Z0IENvcnBvcmF0aW9uMTIwMAYDVQQDEylNaWNyb3Nv
// SIG // ZnQgUm9vdCBDZXJ0aWZpY2F0ZSBBdXRob3JpdHkgMjAx
// SIG // MDAeFw0xMDA3MDEyMTM2NTVaFw0yNTA3MDEyMTQ2NTVa
// SIG // MHwxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5n
// SIG // dG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVN
// SIG // aWNyb3NvZnQgQ29ycG9yYXRpb24xJjAkBgNVBAMTHU1p
// SIG // Y3Jvc29mdCBUaW1lLVN0YW1wIFBDQSAyMDEwMIIBIjAN
// SIG // BgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqR0NvHcR
// SIG // ijog7PwTl/X6f2mUa3RUENWlCgCChfvtfGhLLF/Fw+Vh
// SIG // wna3PmYrW/AVUycEMR9BGxqVHc4JE458YTBZsTBED/Fg
// SIG // iIRUQwzXTbg4CLNC3ZOs1nMwVyaCo0UN0Or1R4HNvyRg
// SIG // MlhgRvJYR4YyhB50YWeRX4FUsc+TTJLBxKZd0WETbijG
// SIG // GvmGgLvfYfxGwScdJGcSchohiq9LZIlQYrFd/XcfPfBX
// SIG // day9ikJNQFHRD5wGPmd/9WbAA5ZEfu/QS/1u5ZrKsajy
// SIG // eioKMfDaTgaRtogINeh4HLDpmc085y9Euqf03GS9pAHB
// SIG // IAmTeM38vMDJRF1eFpwBBU8iTQIDAQABo4IB5jCCAeIw
// SIG // EAYJKwYBBAGCNxUBBAMCAQAwHQYDVR0OBBYEFNVjOlyK
// SIG // MZDzQ3t8RhvFM2hahW1VMBkGCSsGAQQBgjcUAgQMHgoA
// SIG // UwB1AGIAQwBBMAsGA1UdDwQEAwIBhjAPBgNVHRMBAf8E
// SIG // BTADAQH/MB8GA1UdIwQYMBaAFNX2VsuP6KJcYmjRPZSQ
// SIG // W9fOmhjEMFYGA1UdHwRPME0wS6BJoEeGRWh0dHA6Ly9j
// SIG // cmwubWljcm9zb2Z0LmNvbS9wa2kvY3JsL3Byb2R1Y3Rz
// SIG // L01pY1Jvb0NlckF1dF8yMDEwLTA2LTIzLmNybDBaBggr
// SIG // BgEFBQcBAQROMEwwSgYIKwYBBQUHMAKGPmh0dHA6Ly93
// SIG // d3cubWljcm9zb2Z0LmNvbS9wa2kvY2VydHMvTWljUm9v
// SIG // Q2VyQXV0XzIwMTAtMDYtMjMuY3J0MIGgBgNVHSABAf8E
// SIG // gZUwgZIwgY8GCSsGAQQBgjcuAzCBgTA9BggrBgEFBQcC
// SIG // ARYxaHR0cDovL3d3dy5taWNyb3NvZnQuY29tL1BLSS9k
// SIG // b2NzL0NQUy9kZWZhdWx0Lmh0bTBABggrBgEFBQcCAjA0
// SIG // HjIgHQBMAGUAZwBhAGwAXwBQAG8AbABpAGMAeQBfAFMA
// SIG // dABhAHQAZQBtAGUAbgB0AC4gHTANBgkqhkiG9w0BAQsF
// SIG // AAOCAgEAB+aIUQ3ixuCYP4FxAz2do6Ehb7Prpsz1Mb7P
// SIG // BeKp/vpXbRkws8LFZslq3/Xn8Hi9x6ieJeP5vO1rVFcI
// SIG // K1GCRBL7uVOMzPRgEop2zEBAQZvcXBf/XPleFzWYJFZL
// SIG // dO9CEMivv3/Gf/I3fVo/HPKZeUqRUgCvOA8X9S95gWXZ
// SIG // qbVr5MfO9sp6AG9LMEQkIjzP7QOllo9ZKby2/QThcJ8y
// SIG // Sif9Va8v/rbljjO7Yl+a21dA6fHOmWaQjP9qYn/dxUoL
// SIG // kSbiOewZSnFjnXshbcOco6I8+n99lmqQeKZt0uGc+R38
// SIG // ONiU9MalCpaGpL2eGq4EQoO4tYCbIjggtSXlZOz39L9+
// SIG // Y1klD3ouOVd2onGqBooPiRa6YacRy5rYDkeagMXQzafQ
// SIG // 732D8OE7cQnfXXSYIghh2rBQHm+98eEA3+cxB6STOvdl
// SIG // R3jo+KhIq/fecn5ha293qYHLpwmsObvsxsvYgrRyzR30
// SIG // uIUBHoD7G4kqVDmyW9rIDVWZeodzOwjmmC3qjeAzLhIp
// SIG // 9cAvVCch98isTtoouLGp25ayp0Kiyc8ZQU3ghvkqmqMR
// SIG // ZjDTu3QyS99je/WZii8bxyGvWbWu3EQ8l1Bx16HSxVXj
// SIG // ad5XwdHeMMD9zOZN+w2/XU/pnR4ZOC+8z1gFLu8NoFA1
// SIG // 2u8JJxzVs341Hgi62jbb01+P3nSISRKhggLXMIICQAIB
// SIG // ATCCAQChgdikgdUwgdIxCzAJBgNVBAYTAlVTMRMwEQYD
// SIG // VQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25k
// SIG // MR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24x
// SIG // LTArBgNVBAsTJE1pY3Jvc29mdCBJcmVsYW5kIE9wZXJh
// SIG // dGlvbnMgTGltaXRlZDEmMCQGA1UECxMdVGhhbGVzIFRT
// SIG // UyBFU046MDg0Mi00QkU2LUMyOUExJTAjBgNVBAMTHE1p
// SIG // Y3Jvc29mdCBUaW1lLVN0YW1wIFNlcnZpY2WiIwoBATAH
// SIG // BgUrDgMCGgMVAA1NlP4b3paEjXQ/He5KBMazZYwHoIGD
// SIG // MIGApH4wfDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldh
// SIG // c2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNV
// SIG // BAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UE
// SIG // AxMdTWljcm9zb2Z0IFRpbWUtU3RhbXAgUENBIDIwMTAw
// SIG // DQYJKoZIhvcNAQEFBQACBQDkQ8x0MCIYDzIwMjEwNTEw
// SIG // MjMxNTAwWhgPMjAyMTA1MTEyMzE1MDBaMHcwPQYKKwYB
// SIG // BAGEWQoEATEvMC0wCgIFAORDzHQCAQAwCgIBAAICHgMC
// SIG // Af8wBwIBAAICEUMwCgIFAORFHfQCAQAwNgYKKwYBBAGE
// SIG // WQoEAjEoMCYwDAYKKwYBBAGEWQoDAqAKMAgCAQACAweh
// SIG // IKEKMAgCAQACAwGGoDANBgkqhkiG9w0BAQUFAAOBgQCW
// SIG // 9+Tetp4qL6B/EYFdVh20brMkR2UsMNSveVeSjruI5DyU
// SIG // N1mxscmRbJKhQ97od8uCO5Z9Yat9s6wSfe4ynjVpfeNw
// SIG // 3Hah4JIGLFbeCB9/UG+eIEXRab/T9W4UgGNJqQTFu59e
// SIG // uk3QD77TYrbBPJhTd7FAAnw9WJa67sgamXK8WjGCAw0w
// SIG // ggMJAgEBMIGTMHwxCzAJBgNVBAYTAlVTMRMwEQYDVQQI
// SIG // EwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4w
// SIG // HAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xJjAk
// SIG // BgNVBAMTHU1pY3Jvc29mdCBUaW1lLVN0YW1wIFBDQSAy
// SIG // MDEwAhMzAAABOczo6EOL8DThAAAAAAE5MA0GCWCGSAFl
// SIG // AwQCAQUAoIIBSjAaBgkqhkiG9w0BCQMxDQYLKoZIhvcN
// SIG // AQkQAQQwLwYJKoZIhvcNAQkEMSIEID4OEu4Qz/FMWRXv
// SIG // Miz8lxKf0lbSWUZIdx3UASj0RF7PMIH6BgsqhkiG9w0B
// SIG // CRACLzGB6jCB5zCB5DCBvQQgPKGO5Dij1yR7MUKx4oEF
// SIG // rnxqVSfzmnqfJqbUoAcP/J8wgZgwgYCkfjB8MQswCQYD
// SIG // VQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4G
// SIG // A1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0
// SIG // IENvcnBvcmF0aW9uMSYwJAYDVQQDEx1NaWNyb3NvZnQg
// SIG // VGltZS1TdGFtcCBQQ0EgMjAxMAITMwAAATnM6OhDi/A0
// SIG // 4QAAAAABOTAiBCB1gxoZgyYTwVufdgBi+M/EmcSkbspc
// SIG // gCA8NimF8BZZiTANBgkqhkiG9w0BAQsFAASCAQCW7Kp2
// SIG // NomjPTmQ/MDa5q/+UELNxjBJkgZdmSXL8qBml6T+oQKP
// SIG // 9/DUMbRqXQADNGvfxtWFad3S3xyqkH/u+ZtPwU2WB5LC
// SIG // WZA1X7qpDv+e2Pm6vWkEba1iF37xzMH/5GgUoed3NGTs
// SIG // eH+GXbFzlrghMF4GURSWRdEyy0YG4SkU69bmMWm8CpBz
// SIG // QciHHA3X0EBwqBwc9aSZa01fbrErMJ2GmZ+kqbeF5L2a
// SIG // W4xlYiQPR3KLU/va6IVjX6eJI4DHvoFMR3KsSeBJwqSd
// SIG // lI9tjyDcyppmp2sj7284RCXpD7TPWV588NbHsPsXO8aG
// SIG // RfXlC2VW4G9DmiZeacTU5ihTb+9F
// SIG // End signature block
