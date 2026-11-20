# Northstar: Azure AI Speech request

**To:** Bert (approval), Matt Steele (to do the work)
**From:** Ryan Ashline, IS
**Why:** a voice option for the AI assistant in the LLUH app proofs of concept (Northstar and the
Central Services tracker). Central Services staff are standing, gloved and busy; typing is not
realistic. List view standard section 14.8 calls for an enterprise speech service in LLUH's own
tenant so audio never goes to a browser vendor.

## The ask (one request, final)

1. One **Azure AI Speech** resource in the LLUH tenant, US region (West US 2 or East US),
   **Standard (S0)** tier. Name `lluh-poc-speech`, in the POC resource group, tagged owner Ryan
   Ashline, purpose "Northstar / CS Tracker POC".
2. Back to us: the **region**, the **endpoint**, and **one API key** - shared through a password
   manager or pasted directly into the Vercel project's environment variables, never by email or
   Teams.
3. A network check that LLUH managed devices can reach `<region>.stt.speech.microsoft.com` and
   `<region>.tts.speech.microsoft.com` over secure websockets.

## How it is used

- Speech-to-text (streaming from the browser microphone) and neural text-to-speech (streaming the
  answer back).
- The key lives only on the server. The browser receives a 10-minute token from
  `/sts/v1.0/issueToken`, renewed every 8 minutes. No browser holds the key.
- Audio is processed in LLUH's tenant and not retained; logging stays off.
- Synthetic test data only during the POC. No PHI on this path.

## Not needed

No custom models, custom voices, private endpoint or second environment. If the POC becomes a
real service, one further request will follow for Entra-based access in place of the key.

## Northstar side, once the key arrives

| Variable | Where | Notes |
|---|---|---|
| `AZURE_SPEECH_KEY` | Vercel | **Secret.** Server only |
| `AZURE_SPEECH_REGION` | Vercel | e.g. `westus2`. Not secret |

Without them the assistant falls back to the browser's built-in speech, which sends audio to the
browser vendor - acceptable for a demo on a personal device, not for LLUH use.
