import { Link } from 'react-router-dom';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/" className="inline-block mb-8">
          <img src="/images/typelogo_W.png" alt="ROUTELABEL" className="h-12 object-contain" />
        </Link>

        <h1 className="text-3xl font-bold mb-2">개인정보처리방침</h1>
        <p className="text-white/40 text-sm mb-12">시행일: 2026년 1월 27일</p>

        <div className="space-y-10 text-white/70 text-sm leading-relaxed">

          <section>
            <p>
              주식회사 루트레이블(이하 "회사")은 「개인정보 보호법」 제30조에 따라 정보주체의 개인정보를 보호하고
              이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">제1조 (개인정보의 수집 항목 및 수집 방법)</h2>
            <p className="mb-3">회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.</p>

            <div className="space-y-4">
              <div>
                <h3 className="text-white/90 font-medium mb-1">1. 회원가입 시 (필수)</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>이메일 주소</li>
                  <li>비밀번호 (bcrypt 암호화 저장)</li>
                  <li>이름</li>
                </ul>
              </div>

              <div>
                <h3 className="text-white/90 font-medium mb-1">2. 서비스 이용 과정에서 자동 수집</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>IP 주소</li>
                  <li>브라우저 정보 (User-Agent)</li>
                  <li>다운로드 이력 (일시, 음원 정보)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-white/90 font-medium mb-1">3. 문의하기 이용 시</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>이름, 소속(회사/단체명)</li>
                  <li>이메일 주소</li>
                  <li>포트폴리오/작품 링크</li>
                  <li>문의 내용</li>
                </ul>
              </div>

              <div>
                <h3 className="text-white/90 font-medium mb-1">4. 파트너 등록 시 (관리자 생성)</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>사업자명</li>
                  <li>파트너 유형</li>
                  <li>이메일 주소</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">제2조 (개인정보의 수집 및 이용 목적)</h2>
            <p className="mb-3">회사는 수집한 개인정보를 다음의 목적을 위해 이용합니다.</p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-2 pr-4 text-white/90 font-medium">수집 항목</th>
                    <th className="text-left py-2 text-white/90 font-medium">이용 목적</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  <tr>
                    <td className="py-2 pr-4">이메일, 이름, 비밀번호</td>
                    <td className="py-2">회원 식별 및 인증, 서비스 제공</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">IP 주소, User-Agent</td>
                    <td className="py-2">부정이용 방지, 다운로드 이력 관리</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">다운로드 이력</td>
                    <td className="py-2">음원 이용 현황 파악, 저작권 관리</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">문의 정보</td>
                    <td className="py-2">문의 응대 및 상담 서비스 제공</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">파트너 정보</td>
                    <td className="py-2">파트너 협업 관리, 프로젝트 접근 권한 부여</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">제3조 (개인정보의 보유 및 이용 기간)</h2>
            <p className="mb-3">회사는 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.</p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-2 pr-4 text-white/90 font-medium">구분</th>
                    <th className="text-left py-2 text-white/90 font-medium">보유 기간</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  <tr>
                    <td className="py-2 pr-4">회원 정보</td>
                    <td className="py-2">회원 탈퇴 시까지</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">다운로드 로그</td>
                    <td className="py-2">저작권 관리 목적으로 3년 보관 (탈퇴 시 익명화 처리)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">문의 내용</td>
                    <td className="py-2">문의 처리 완료 후 1년</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">접속 로그</td>
                    <td className="py-2">「통신비밀보호법」에 따라 3개월</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">제4조 (개인정보의 제3자 제공)</h2>
            <p className="mb-3">
              회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.
              다만, 다음의 경우에는 예외로 합니다.
            </p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>이용자가 사전에 동의한 경우</li>
              <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">제5조 (개인정보 처리 위탁)</h2>
            <p className="mb-3">회사는 서비스 제공을 위해 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다.</p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-2 pr-4 text-white/90 font-medium">수탁업체</th>
                    <th className="text-left py-2 text-white/90 font-medium">위탁 업무</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  <tr>
                    <td className="py-2 pr-4">Supabase Inc.</td>
                    <td className="py-2">데이터베이스 및 파일 스토리지 호스팅</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Vercel Inc.</td>
                    <td className="py-2">프론트엔드 웹 서비스 호스팅</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Railway Corp.</td>
                    <td className="py-2">백엔드 API 서버 호스팅</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3">위탁 시 개인정보가 안전하게 관리될 수 있도록 관련 법령에 따라 필요한 사항을 규정하고 있습니다.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">제6조 (정보주체의 권리·의무 및 행사방법)</h2>
            <p className="mb-3">이용자는 개인정보주체로서 다음과 같은 권리를 행사할 수 있습니다.</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>개인정보 열람 요구</li>
              <li>오류 등이 있을 경우 정정 요구</li>
              <li>삭제 요구</li>
              <li>처리정지 요구</li>
            </ol>
            <p className="mt-3">
              위 권리 행사는 이메일(route@routelabel.org)을 통해 하실 수 있으며,
              회사는 이에 대해 지체 없이 조치하겠습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">제7조 (개인정보의 안전성 확보 조치)</h2>
            <p className="mb-3">회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li><strong className="text-white/90">비밀번호 암호화:</strong> bcrypt 알고리즘을 사용하여 비밀번호를 단방향 암호화 저장합니다.</li>
              <li><strong className="text-white/90">전송 구간 암호화:</strong> HTTPS(SSL/TLS)를 통해 데이터를 암호화하여 전송합니다.</li>
              <li><strong className="text-white/90">접근 제한:</strong> 인증 토큰(JWT) 기반으로 서비스 접근을 제어하며, 역할별 권한을 분리합니다.</li>
              <li><strong className="text-white/90">파일 접근 보호:</strong> 서명된 URL(Signed URL)을 사용하여 만료 시간이 설정된 임시 접근만 허용합니다.</li>
              <li><strong className="text-white/90">계정 보호:</strong> 비정상적인 로그인 시도 시 계정 잠금 기능을 적용합니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">제8조 (쿠키 및 로컬 스토리지)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>회사는 별도의 쿠키(Cookie)를 사용하지 않습니다.</li>
              <li>서비스 인증을 위해 브라우저 로컬 스토리지(localStorage)에 인증 토큰(JWT)을 저장합니다.</li>
              <li>로그아웃 시 해당 토큰은 자동으로 삭제됩니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">제9조 (개인정보 보호책임자)</h2>
            <p className="mb-3">회사는 개인정보 처리에 관한 업무를 총괄해서 책임지는 개인정보 보호책임자를 다음과 같이 지정합니다.</p>
            <div className="bg-white/5 rounded-lg p-4 space-y-1">
              <p><strong className="text-white/90">개인정보 보호책임자</strong></p>
              <p>성명: 최선</p>
              <p>직위: 대표이사</p>
              <p>이메일: route@routelabel.org</p>
            </div>
            <p className="mt-3">
              이용자는 서비스를 이용하면서 발생한 모든 개인정보 보호 관련 문의, 불만처리, 피해구제 등에 관한 사항을
              개인정보 보호책임자에게 문의하실 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">제10조 (권익침해 구제방법)</h2>
            <p className="mb-3">이용자는 개인정보침해로 인한 구제를 받기 위하여 다음 기관에 분쟁해결이나 상담을 신청할 수 있습니다.</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>개인정보분쟁조정위원회: (국번없이) 1833-6972 (www.kopico.go.kr)</li>
              <li>개인정보침해신고센터: (국번없이) 118 (privacy.kisa.or.kr)</li>
              <li>대검찰청: (국번없이) 1301 (www.spo.go.kr)</li>
              <li>경찰청: (국번없이) 182 (ecrm.cyber.go.kr)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">제11조 (개인정보 처리방침 변경)</h2>
            <p>이 개인정보처리방침은 2026년 1월 27일부터 적용됩니다. 변경 사항이 있을 경우 서비스 내 공지를 통해 고지하겠습니다.</p>
          </section>

          <section className="border-t border-white/10 pt-8">
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
          <Link to="/terms" className="hover:text-white/60 transition-colors">이용약관</Link>
          <Link to="/" className="hover:text-white/60 transition-colors">홈으로</Link>
        </div>
      </div>
    </div>
  );
}
