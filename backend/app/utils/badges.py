from sqlalchemy.orm import Session
from app.models.models import User, Badge, UserBadge, LessonProgress, TestAttempt


def check_and_award_badges(db: Session, user: User) -> list[str]:
    """Check conditions and award badges. Returns list of newly awarded badge keys."""
    awarded = []
    existing_keys = {ub.badge.key for ub in user.badges}

    badges_map = {b.key: b for b in db.query(Badge).all()}

    def award(key: str):
        if key not in existing_keys and key in badges_map:
            db.add(UserBadge(user_id=user.id, badge_id=badges_map[key].id))
            awarded.append(key)

    completed_lessons = db.query(LessonProgress).filter(
        LessonProgress.user_id == user.id, LessonProgress.completed == True
    ).count()

    test_attempts = db.query(TestAttempt).filter(TestAttempt.user_id == user.id).all()
    passed_tests = sum(1 for a in test_attempts if a.score > 0 and a.score >= a.max_score * 0.6)
    perfect_tests = sum(1 for a in test_attempts if a.score == a.max_score and a.max_score > 0)

    if completed_lessons >= 1:
        award("first_lesson")
    if len(test_attempts) >= 1:
        award("first_test")
    if completed_lessons >= 5:
        award("five_lessons")
    if passed_tests >= 3:
        award("three_tests_passed")
    if perfect_tests >= 1:
        award("perfect_score")
    if user.streak_days >= 7:
        award("seven_day_streak")

    if awarded:
        db.commit()

    return awarded
