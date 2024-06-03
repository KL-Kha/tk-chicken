from odoo import http
import logging
from odoo.http import request
# from .tools._vendor import sessions
# from .tools.func import filter_kwargs, lazy_property

from odoo.http import request
from odoo.tools.func import lazy_property
from odoo.http import root, db_filter, db_list

_logger = logging.getLogger(__name__)


DEFAULT_SESSION = {
    'context': {
        #'lang': request.default_lang()  # must be set at runtime
    },
    'db': None,
    'debug': '',
    'login': None,
    'uid': None,
    'session_token': None,
    # profiling
    'profile_session': None,
    'profile_collectors': None,
    'profile_params': None,
}



def _get_session_and_dbname(self):
    # The session is explicit when it comes from the query-string or
    # the header. It is implicit when it comes from the cookie or
    # that is does not exist yet. The explicit session should be
    # used in this request only, it should not be saved on the
    # response cookie.

    sid = (self.httprequest.args.get('session_id')
        or self.httprequest.headers.get("X-Openerp-Session-Id"))

    db_from_request = self.httprequest.values.get("db") or self.httprequest.headers.get("db")
    
    if sid:
        is_explicit = True
    else:
        sid = self.httprequest.cookies.get('session_id')
        is_explicit = False

    if sid is None:
        session = root.session_store.new()
    else:
        session = root.session_store.get(sid)
        session.sid = sid  # in case the session was not persisted
    session.is_explicit = is_explicit

    for key, val in DEFAULT_SESSION.items():
        session.setdefault(key, val)
    if not session.context.get('lang'):
        session.context['lang'] = self.default_lang()

    dbname = None
    host = self.httprequest.environ['HTTP_HOST']

    if session.db and db_filter([session.db], host=host):
        dbname = session.db
    else:
        all_dbs = db_list(force=True, host=host)
        if len(all_dbs) == 1:
            dbname = all_dbs[0]  # monodb

        # if db received in request
        if db_from_request and db_filter([db_from_request], host=host):
            dbname = db_from_request
    if session.db != dbname:
        if session.db:
            _logger.warning("Logged into database %r, but dbfilter rejects it; logging session out.", session.db)
            session.logout(keep_db=False)
        session.db = dbname
    session.is_dirty = False

    return session, dbname

http.Request._get_session_and_dbname = _get_session_and_dbname
