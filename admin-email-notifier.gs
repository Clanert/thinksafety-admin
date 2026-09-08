/**
 * ThinkSafety admin email notifier.
 *
 * Deploy this as a Google Apps Script web app, then paste its URL into the ThinkSafety admin
 * dashboard under Settings -> admin_webhook_url. The database calls it whenever a worker registers,
 * an order is placed, a payment is submitted, or a lesson is commented on, and it emails you.
 *
 * Nothing secret lives here. It sends from your own Google account, so no email API key exists to
 * leak, and you can revoke it at any time by deleting the deployment.
 *
 * ---------------------------------------------------------------------------
 * HOW TO DEPLOY
 * ---------------------------------------------------------------------------
 * 1. Go to script.google.com and create a new project.
 * 2. Delete whatever is in Code.gs and paste this file in.
 * 3. Save.
 * 4. Deploy -> New deployment -> type "Web app".
 *      Execute as:        Me
 *      Who has access:    Anyone
 *    "Anyone" is required because your database calls it without signing in. The URL is the only
 *    thing protecting it, so treat it as private and re-deploy if it ever leaks.
 * 5. Authorise it when Google asks. It only needs permission to send mail as you.
 * 6. Copy the web app URL.
 * 7. In the ThinkSafety admin dashboard: Settings -> admin_webhook_url -> paste -> Save.
 *
 * Test it by registering a worker in the app; the email should arrive within a few seconds.
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // Fall back to the account running the script if no address was configured.
    var to = data.to || Session.getEffectiveUser().getEmail();
    var subject = '[ThinkSafety] ' + (data.subject || 'Notification');
    var body = buildBody(data);

    MailApp.sendEmail({
      to: to,
      subject: subject,
      htmlBody: body,
      name: 'ThinkSafety'
    });

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function buildBody(data) {
  var kindLabel = {
    new_user: 'New worker registered',
    new_order: 'New PPE order',
    new_payment: 'Payment awaiting your approval',
    new_comment: 'New comment on a lesson'
  }[data.kind] || 'Notification';

  var rows = '';
  var p = data.payload || {};
  Object.keys(p).forEach(function (k) {
    var v = p[k];
    if (v === null || v === '' || typeof v === 'object') return;
    rows +=
      '<tr>' +
      '<td style="padding:6px 12px;border-bottom:1px solid #eae7e7;color:#7d7979;font-size:13px">' +
      escapeHtml(k) +
      '</td>' +
      '<td style="padding:6px 12px;border-bottom:1px solid #eae7e7;font-size:13px">' +
      escapeHtml(String(v)) +
      '</td></tr>';
  });

  // Payment proof, when the worker attached a screenshot.
  var proof = p.proof_url
    ? '<p style="margin:16px 0"><a href="' + escapeHtml(p.proof_url) +
      '" style="color:#243d91">View the payment proof</a></p>'
    : '';

  return (
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px">' +
    '<div style="background:#243d91;color:#fff;padding:18px 20px">' +
    '<div style="font-size:18px;font-weight:bold">Think<span style="color:#8cc641">Safety</span></div>' +
    '<div style="font-size:13px;opacity:.85;margin-top:2px">' + escapeHtml(kindLabel) + '</div>' +
    '</div>' +
    '<div style="padding:20px;border:1px solid #eae7e7;border-top:none">' +
    '<p style="font-size:15px;margin:0 0 14px">' + escapeHtml(data.body || '') + '</p>' +
    proof +
    (rows ? '<table style="border-collapse:collapse;width:100%">' + rows + '</table>' : '') +
    '<p style="margin-top:20px;font-size:12px;color:#7d7979">' +
    'Open the admin dashboard to act on this.' +
    '</p>' +
    '</div></div>'
  );
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/** Run this once from the editor to check mail sending works before wiring up the database. */
function testEmail() {
  MailApp.sendEmail({
    to: Session.getEffectiveUser().getEmail(),
    subject: '[ThinkSafety] Test',
    htmlBody: buildBody({
      kind: 'new_user',
      body: 'This is a test. If you can read this, the notifier is working.',
      payload: { full_name: 'Test Worker', phone: '0700000000' }
    }),
    name: 'ThinkSafety'
  });
}
