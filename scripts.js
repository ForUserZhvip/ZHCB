document.addEventListener('DOMContentLoaded', function() {
    const touchIDSetupButton = document.getElementById('setupTouchID');
    const touchIDVerifyButton = document.getElementById('verifyTouchID');
    const touchIDError = document.getElementById('touch-id-error');
    const mainContent = document.getElementById('main-content');
    const touchIDSetup = document.getElementById('touch-id-setup');

    // Set up Touch ID
    touchIDSetupButton.addEventListener('click', function() {
        touchIDError.textContent = '';
        showBiometricPrompt();

        if (!window.PublicKeyCredential) {
            touchIDError.textContent = 'Touch ID is not supported on this device or browser.';
            hideBiometricPrompt();
            return;
        }

        navigator.credentials.create({
            publicKey: {
                challenge: Uint8Array.from('randomStringFromServer', c => c.charCodeAt(0)),
                rp: {
                    name: 'ZHCYBER',
                    id: window.location.hostname // Ensure the domain is valid for WebAuthn
                },
                user: {
                    id: Uint8Array.from('uniqueUserID', c => c.charCodeAt(0)),
                    name: 'user@example.com',
                    displayName: 'User'
                },
                pubKeyCredParams: [{
                    type: 'public-key',
                    alg: -7 // ES256 algorithm
                }]
            }
        }).then(credential => {
            localStorage.setItem('touchIDCredential', JSON.stringify(credential));
            alert('Touch ID setup complete.');
            verifyTouchID();
        }).catch(error => {
            console.error(error);
            if (error.message.includes('invalid domain')) {
                touchIDError.innerHTML = `
                    Touch ID setup failed: This site is not allowed to use WebAuthn.<br>
                    <strong>Possible reasons:</strong><br>
                    - The current domain is not secure (must be HTTPS).<br>
                    - You're testing on localhost or an IP address.<br><br>
                    <strong>Solutions:</strong><br>
                    - Use a secure domain or a valid HTTPS URL.<br>
                    - If testing locally, use a tunneling service like ngrok or localhost.run.
                `;
            } else {
                touchIDError.textContent = 'Touch ID setup failed: ' + error.message;
            }
            hideBiometricPrompt();
        });
    });

    // Verify Touch ID
    touchIDVerifyButton.addEventListener('click', function() {
        showBiometricPrompt();
        verifyTouchID();
    });

    function verifyTouchID() {
        const storedCredential = localStorage.getItem('touchIDCredential');
        if (!storedCredential) {
            touchIDError.textContent = 'No Touch ID credential found. Please set it up first.';
            hideBiometricPrompt();
            return;
        }

        const credential = JSON.parse(storedCredential);
        navigator.credentials.get({
            publicKey: {
                challenge: Uint8Array.from('randomChallengeFromServer', c => c.charCodeAt(0)),
                allowCredentials: [{
                    type: 'public-key',
                    id: new Uint8Array(credential.rawId),
                    transports: ['internal']
                }]
            }
        }).then(assertion => {
            alert('Touch ID verified.');
            touchIDSetup.style.display = 'none';
            mainContent.style.display = 'block';
        }).catch(error => {
            console.error(error);
            touchIDError.textContent = 'Touch ID verification failed: ' + error.message;
            hideBiometricPrompt();
        });
    }

    function showBiometricPrompt() {
        const prompt = document.createElement('div');
        prompt.id = 'biometric-animation';
        document.querySelector('.overlay-content').appendChild(prompt);

        const message = document.createElement('p');
        message.className = 'biometric-prompt';
        message.textContent = 'Touch the fingerprint sensor';
        document.querySelector('.overlay-content').appendChild(message);
    }

    function hideBiometricPrompt() {
        const prompt = document.getElementById('biometric-animation');
        if (prompt) prompt.remove();

        const message = document.querySelector('.biometric-prompt');
        if (message) message.remove();
    }

    // Initial check to show or hide Touch ID setup
    if (localStorage.getItem('touchIDCredential')) {
        mainContent.style.display = 'block';
        touchIDSetup.style.display = 'none';
    }
});
