import { Link } from 'react-router-dom';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/" className="inline-block mb-8">
          <img src="/images/typelogo_W.png" alt="ROUTELABEL" className="h-12 object-contain" />
        </Link>

        <h1 className="text-3xl font-bold mb-2">이용약관</h1>
        <p className="text-white/40 text-sm mb-12">시행일: 2026년 1월 27일</p>

        <div className="space-y-10 text-white/70 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">제1조 (목적)</h2>
            <p>
              이 약관은 주식회사 루트레이블(이하 "회사")이 운영하는 음원 유통 및 웹툰 BGM 연동 플랫폼(이하 "서비스")의 이용과 관련하여
              회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">제2조 (정의)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>"서비스"란 회사가 제공하는 음원 스트리밍, 다운로드, 웹툰 프로젝트 BGM 연동 및 관련 부가 서비스를 말합니다.</li>
              <li>"이용자"란 이 약관에 따라 회사가 제공하는 서비스를 이용하는 자를 말합니다.</li>
              <li>"파트너"란 회사와 협업 계약을 체결하고 웹툰 프로젝트에 참여하는 사업자를 말합니다.</li>
              <li>"초대코드"란 회사가 발급하는 서비스 가입용 고유 코드를 말합니다.</li>
              <li>"음원"이란 서비스를 통해 제공되는 음악 파일 및 관련 메타데이터를 말합니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">제3조 (약관의 효력 및 변경)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>이 약관은 서비스 내에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</li>
              <li>회사는 관련 법령에 위배되지 않는 범위에서 이 약관을 변경할 수 있으며, 변경 시 적용일자 및 변경사유를 명시하여 최소 7일 전에 공지합니다.</li>
              <li>이용자가 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">제4조 (회원가입 및 계정)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>서비스 가입은 회사가 발급한 초대코드를 통해서만 가능합니다.</li>
              <li>초대코드는 1회 사용 가능하며, 타인에게 양도하거나 공유할 수 없습니다.</li>
              <li>이용자는 가입 시 정확한 정보를 제공해야 하며, 허위 정보 제공 시 서비스 이용이 제한될 수 있습니다.</li>
              <li>계정 정보(이메일, 비밀번호)의 관리 책임은 이용자에게 있으며, 타인에게 공유할 수 없습니다.</li>
              <li>파트너 계정은 회사 관리자가 직접 생성하며, 별도의 파트너 계약 조건이 적용됩니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">제5조 (서비스의 내용)</h2>
            <p className="mb-2">회사가 제공하는 서비스는 다음과 같습니다.</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>음원 스트리밍 및 다운로드 서비스</li>
              <li>웹툰 프로젝트 BGM 연동 서비스</li>
              <li>파트너 협업 및 프로젝트 공유 서비스</li>
              <li>문의 및 상담 서비스</li>
              <li>기타 회사가 정하는 서비스</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">제6조 (음원 이용 범위 및 저작권)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>서비스를 통해 제공되는 모든 음원의 저작권은 회사 또는 원저작권자에게 귀속됩니다.</li>
              <li>이용자에게는 서비스 내에서의 스트리밍 및 개인 소장 목적의 다운로드에 한한 비독점적 이용 라이선스가 부여됩니다.</li>
              <li>
                이용자는 다음 행위를 할 수 없습니다.
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>음원의 무단 복제, 배포, 전송, 재판매</li>
                  <li>음원의 2차 저작물 작성 (리믹스, 편곡 등) 후 무단 배포</li>
                  <li>음원을 상업적 목적으로 무단 사용</li>
                  <li>기술적 보호조치의 우회 또는 해제</li>
                </ul>
              </li>
              <li>파트너는 웹툰 프로젝트 내에서 회사가 허용한 범위에서만 음원을 사용할 수 있으며, 프로젝트 외 사용은 별도 계약이 필요합니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">제7조 (파트너 협업)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>파트너는 회사가 할당한 웹툰 프로젝트에 대해서만 접근 및 편집 권한을 가집니다.</li>
              <li>프로젝트 공유 링크의 생성 및 관리 책임은 해당 프로젝트에 참여하는 파트너에게 있습니다.</li>
              <li>파트너가 프로젝트에 업로드한 이미지 등 콘텐츠의 저작권 관계는 별도의 파트너 계약에 따릅니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">제8조 (이용자의 의무)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>이용자는 관계 법령, 이 약관의 규정, 이용안내 등 회사가 공지하는 사항을 준수해야 합니다.</li>
              <li>이용자는 서비스를 통해 얻은 정보를 회사의 사전 승인 없이 복제, 배포, 방송 기타 방법으로 이용하거나 제3자에게 제공할 수 없습니다.</li>
              <li>이용자는 서비스의 안정적 운영을 방해하는 행위를 해서는 안 됩니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">제9조 (서비스의 변경 및 중단)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>회사는 서비스의 내용을 변경하거나 중단할 수 있으며, 이 경우 사전에 공지합니다.</li>
              <li>천재지변, 시스템 장애 등 불가항력적 사유로 서비스가 중단된 경우 회사는 책임을 지지 않습니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">제10조 (계정 해지 및 이용 제한)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>이용자는 언제든지 회사에 해지 의사를 통지하여 탈퇴할 수 있습니다.</li>
              <li>회사는 이용자가 이 약관을 위반한 경우 서비스 이용을 제한하거나 계정을 해지할 수 있습니다.</li>
              <li>계정 해지 시 이용자의 개인정보는 개인정보처리방침에 따라 처리됩니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">제11조 (면책조항)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중지 등 불가항력적 사유로 서비스를 제공할 수 없는 경우 책임이 면제됩니다.</li>
              <li>회사는 이용자의 귀책사유로 인한 서비스 이용 장애에 대해 책임을 지지 않습니다.</li>
              <li>회사는 이용자가 서비스를 통해 기대하는 수익이나 효과를 보장하지 않습니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">제12조 (분쟁해결)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>이 약관에 관한 분쟁은 대한민국 법률에 따라 해석됩니다.</li>
              <li>서비스 이용과 관련하여 분쟁이 발생한 경우 서울서부지방법원을 관할 법원으로 합니다.</li>
            </ol>
          </section>

          <section className="border-t border-white/10 pt-8">
            <p className="text-white/40">
              <strong className="text-white/60">부칙</strong><br />
              이 약관은 2026년 1월 27일부터 시행합니다.
            </p>
          </section>

          <section>
            <p className="text-white/40">
              <strong className="text-white/60">주식회사 루트레이블</strong><br />
              대표: 최선<br />
              사업자등록번호: 846-81-08268<br />
              주소: 서울특별시 서대문구 연세로5나길 16, 지하 1층<br />
              이메일: route@routelabel.org
            </p>
          </section>

        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex gap-6 text-sm text-white/40">
          <Link to="/privacy" className="hover:text-white/60 transition-colors">개인정보처리방침</Link>
          <Link to="/" className="hover:text-white/60 transition-colors">홈으로</Link>
        </div>
      </div>
    </div>
  );
}
