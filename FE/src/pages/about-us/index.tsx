import React from "react";
import { Card, Row, Col } from "antd";

const AboutUsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">
            Về chúng tôi
          </h1>

          <div className="max-w-4xl mx-auto space-y-6  text-lg leading-relaxed">
            <p>
              <span className="text-accent font-semibold">
                Rent For Travel (RFT)
              </span>{" "}
              là một nền tảng kết nối dịch vụ cho thuê xe tại các điểm du lịch
              trên toàn quốc – từ xe máy, xe đạp cho đến ô tô. Chúng tôi ra đời
              với mong muốn mang đến cho du khách sự thuận tiện, linh hoạt và
              chủ động hơn trong mỗi hành trình khám phá.
            </p>

            <p>
              Dự án được xây dựng bằng tinh thần nhiệt huyết, sự sáng tạo và nỗ
              lực không ngừng nghỉ của cả nhóm. Chúng tôi tin rằng mỗi chuyến đi
              sẽ tuyệt vời hơn khi bạn có phương tiện phù hợp – dễ tìm, dễ thuê,
              minh bạch và an toàn.
            </p>

            <p>
              Hy vọng <span className="text-accent font-semibold">RFT</span> sẽ
              không chỉ là người bạn đồng hành trong chuyến đi của bạn, mà còn
              là một phần của sự thay đổi tích cực trong thói quen du lịch –
              tiết kiệm, linh hoạt và thân thiện với môi trường.
            </p>
          </div>
        </div>
      </div>

      {/* Team Creators Section */}
      <div className="py-16 px-4 sm:px-6 lg:px-8 ">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-secondary mb-12 text-center">
            Những người sáng lập dự án Rent For Travel (RFT)
          </h2>

          <div className="space-y-4 text-gray-700 text-lg max-w-4xl mx-auto mb-12">
            <ul className="list-disc list-inside space-y-2">
              <li>Hạ Xuân Hậu</li>
              <li>Phạm Huy Long</li>
              <li>Lê Đình Hiếu</li>
              <li>Phạm Trọng Tiệp</li>
              <li>Nguyễn Minh Nghĩa</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Team Development Section */}
      <div className="py-16 px-4 sm:px-6 lg:px-8 ">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-secondary mb-12 text-center">
            Những người phát triển website Rent For Travel
          </h2>

          <Row gutter={[24, 24]} justify="center">
            {/* Leader Card */}
            <Col xs={24} sm={12} lg={8}>
              <Card
                className="h-full shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-blue-200 hover:border-blue-400"
                bodyStyle={{ padding: "24px" }}
              >
                <div className="text-center">
                  <div className="mb-4">
                    <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto flex items-center justify-center">
                      <span className="text-2xl font-bold text-blue-600">
                        HXH
                      </span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-blue-600 mb-4">
                    Hạ Xuân Hậu
                  </h3>
                  <div className="space-y-2 text-gray-600">
                    <p>• Team Leader</p>
                    <p>• Project Manager</p>
                    <p>• Database Designer</p>
                  </div>
                </div>
              </Card>
            </Col>

            {/* Frontend Developer Card */}
            <Col xs={24} sm={12} lg={8}>
              <Card
                className="h-full shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-green-200 hover:border-green-400"
                bodyStyle={{ padding: "24px" }}
              >
                <div className="text-center">
                  <div className="mb-4">
                    <div className="w-20 h-20 bg-green-100 rounded-full mx-auto flex items-center justify-center">
                      <span className="text-2xl font-bold text-green-600">
                        LDH
                      </span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-green-600 mb-4">
                    Lê Đình Hiếu
                  </h3>
                  <div className="space-y-2 text-gray-600">
                    <p>• Frontend Developer</p>
                    <p>• UI/UX Designer</p>
                  </div>
                </div>
              </Card>
            </Col>

            {/* Backend Developer Card 1 */}
            <Col xs={24} sm={12} lg={8}>
              <Card
                className="h-full shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-purple-200 hover:border-purple-400"
                bodyStyle={{ padding: "24px" }}
              >
                <div className="text-center">
                  <div className="mb-4">
                    <div className="w-20 h-20 bg-purple-100 rounded-full mx-auto flex items-center justify-center">
                      <span className="text-2xl font-bold text-purple-600">
                        PHL
                      </span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-purple-600 mb-4">
                    Phạm Huy Long
                  </h3>
                  <div className="space-y-2 text-gray-600">
                    <p>• Backend Developer</p>
                    <p>• API Developer</p>
                  </div>
                </div>
              </Card>
            </Col>

            {/* Backend Developer Card 2 */}
            <Col xs={24} sm={12} lg={8}>
              <Card
                className="h-full shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-purple-200 hover:border-purple-400"
                bodyStyle={{ padding: "24px" }}
              >
                <div className="text-center">
                  <div className="mb-4">
                    <div className="w-20 h-20 bg-purple-100 rounded-full mx-auto flex items-center justify-center">
                      <span className="text-2xl font-bold text-purple-600">
                        PTT
                      </span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-purple-600 mb-4">
                    Phạm Trọng Tiệp
                  </h3>
                  <div className="space-y-2 text-gray-600">
                    <p>• Backend Developer</p>
                    <p>• API Developer</p>
                  </div>
                </div>
              </Card>
            </Col>

            {/* Backend Developer Card 3 */}
            <Col xs={24} sm={12} lg={8}>
              <Card
                className="h-full shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-purple-200 hover:border-purple-400"
                bodyStyle={{ padding: "24px" }}
              >
                <div className="text-center">
                  <div className="mb-4">
                    <div className="w-20 h-20 bg-purple-100 rounded-full mx-auto flex items-center justify-center">
                      <span className="text-2xl font-bold text-purple-600">
                        NMN
                      </span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-purple-600 mb-4">
                    Nguyễn Minh Nghĩa
                  </h3>
                  <div className="space-y-2 text-gray-600">
                    <p>• Backend Developer</p>
                    <p>• API Developer</p>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r bg-fourth">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-secondary">
            Sứ mệnh của chúng tôi
          </h2>
          <p className="text-lg  leading-relaxed">
            RFT ra đời để giúp du khách dễ dàng tìm kiếm và thuê phương tiện di
            chuyển phù hợp tại các địa điểm du lịch – từ trung tâm thành phố đến
            các vùng xa. Chúng tôi mong muốn xây dựng một hệ sinh thái du lịch
            thông minh, tiết kiệm và bền vững cho cộng đồng.
          </p>
        </div>
      </div>

      {/* Vision Section */}
      <div className="py-16 px-4 sm:px-6 lg:px-8 ">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-secondary mb-8">Tầm nhìn</h2>
          <p className="text-lg  leading-relaxed">
            Trở thành nền tảng hàng đầu tại Việt Nam trong lĩnh vực cho thuê
            phương tiện du lịch – kết nối người thuê và chủ xe một cách nhanh
            chóng, an toàn và tiện lợi. Góp phần nâng cao trải nghiệm du lịch
            thông minh, thân thiện với môi trường và đầy cảm hứng.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutUsPage;
