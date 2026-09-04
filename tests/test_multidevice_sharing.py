import pytest
from fastapi.testclient import TestClient
from guardrag.api.main import app
from guardrag.api import db

client = TestClient(app)

def test_multidevice_isolation_and_host_monitoring():
    # 1. Create a parent session
    parent_id = 'test_host_session_multidevice'
    db.save_session(
        session_id=parent_id,
        db_id='test_db_id',
        model='gemma3:1b',
        files=['financial_report.pdf'],
        chunk_size=1000,
        redact_pii=False,
        system_prompt='Test host prompt',
        sensitivity_level='Internal',
        enable_guardrails=True,
        messages=[{'role': 'user', 'content': 'Host initial question'}]
    )

    # 2. Generate an isolated share link with history visible
    res_gen = client.post('/api/share/generate', json={
        'session_id': parent_id,
        'name': 'Team Shared Workspace',
        'show_history': True,
        'read_only': False,
        'sync': False,
        'min_confidence': 0.5
    })
    assert res_gen.status_code == 200
    share_id = res_gen.json()['share_id']

    # 3. Simulate Device A (iPhone) first visit
    res_dev_a = client.get(f'/api/share/resolve/{share_id}', headers={'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0)'})
    assert res_dev_a.status_code == 200
    data_a = res_dev_a.json()
    dev_a_sess = data_a['client_session_id']
    assert dev_a_sess.startswith('client_')
    assert len(data_a['messages']) == 1

    # 4. Simulate Device B (Windows Laptop) first visit
    res_dev_b = client.get(f'/api/share/resolve/{share_id}', headers={'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    assert res_dev_b.status_code == 200
    data_b = res_dev_b.json()
    dev_b_sess = data_b['client_session_id']
    assert dev_b_sess != dev_a_sess

    # 5. Device A reconnects (browser reload) passing its client_id
    res_dev_a_reload = client.get(
        f"/api/share/resolve/{share_id}?client_id={dev_a_sess}",
        headers={"user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0)"}
    )
    assert res_dev_a_reload.status_code == 200
    assert res_dev_a_reload.json()['session_id'] == dev_a_sess

    # 6. Simulate Device A chatting
    sess_a = db.get_session(dev_a_sess)
    sess_a['messages'].append({'role': 'user', 'content': 'Hello from iPhone'})
    sess_a['messages'].append({'role': 'assistant', 'content': 'Hello iPhone user'})
    db.save_session(
        session_id=dev_a_sess,
        db_id=sess_a['db_id'],
        model=sess_a['model'],
        files=sess_a['files'],
        chunk_size=sess_a['chunk_size'],
        redact_pii=sess_a['redact_pii'],
        system_prompt=sess_a['system_prompt'],
        sensitivity_level=sess_a['sensitivity_level'],
        enable_guardrails=sess_a['enable_guardrails'],
        messages=sess_a['messages']
    )
    db.touch_client_session(dev_a_sess)

    # 7. Host calls list_client_sessions to monitor activities
    res_host = client.get(f'/api/share/client-chats/{parent_id}')
    assert res_host.status_code == 200
    clients_list = res_host.json()['clients']
    client_ids = [c['client_session_id'] for c in clients_list]
    assert dev_a_sess in client_ids
    assert dev_b_sess in client_ids

    record_a = next(c for c in clients_list if c['client_session_id'] == dev_a_sess)
    assert record_a['message_count'] == 3
    assert len(record_a['messages']) == 3
    assert 'iPhone' in record_a['user_agent']

    # 8. Test Read-Only Share Link rejection
    res_ro_gen = client.post('/api/share/generate', json={
        'session_id': parent_id,
        'name': 'Read Only Link',
        'show_history': False,
        'read_only': True,
        'sync': False
    })
    assert res_ro_gen.status_code == 200
    ro_share_id = res_ro_gen.json()['share_id']

    res_ro_resolve = client.get(f'/api/share/resolve/{ro_share_id}')
    assert res_ro_resolve.status_code == 200
    ro_client_sess = res_ro_resolve.json()['client_session_id']
    assert res_ro_resolve.json()['read_only'] is True

    res_chat_blocked = client.post('/api/chat', json={
        'session_id': ro_client_sess,
        'question': 'Can I write here?'
    })
    assert res_chat_blocked.status_code == 403
    assert 'read-only' in res_chat_blocked.json()['detail'].lower()
