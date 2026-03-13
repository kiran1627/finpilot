from app.api.run_cycle import run_autonomy_cycle


def test_full_autonomy_cycle_runs():
    result = run_autonomy_cycle()

    assert "chosen_strategy" in result
    assert "explanation" in result
    assert "audit_log" in result
